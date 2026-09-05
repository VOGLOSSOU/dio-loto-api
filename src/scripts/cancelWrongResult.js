const { sequelize, Game, Result, Ticket, User } = require('../db/sequelize');
const { Op } = require('sequelize');

const DEFAULT_VALIDATION_WINDOW_MINUTES = 15;

function parseArguments(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const windowArgument = argv.find((arg) => arg.startsWith('--window-minutes='));
  const validationWindowMinutes = windowArgument
    ? Number(windowArgument.split('=')[1])
    : DEFAULT_VALIDATION_WINDOW_MINUTES;

  if (!positional[0]) {
    throw new Error(
      'Nom du jeu requis. Exemple : npm run result:cancel -- benin18',
    );
  }
  if (!Number.isFinite(validationWindowMinutes) || validationWindowMinutes <= 0) {
    throw new Error('--window-minutes doit être un nombre strictement positif.');
  }

  return {
    gameName: positional[0].trim(),
    apply: argv.includes('--apply'),
    acknowledgeCreditedGains: argv.includes('--acknowledge-credited-gains'),
    validationWindowMinutes,
  };
}

function getGainAttributionDate(ticket) {
  const gains = ticket.gains;
  if (!gains || typeof gains !== 'object' || !gains.dateAttribution) {
    return null;
  }

  const date = new Date(gains.dateAttribution);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function inspectIncident({ gameName, validationWindowMinutes, transaction }) {
  const game = await Game.findOne({
    where: { nom: gameName },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!game) {
    throw new Error(`Jeu "${gameName}" introuvable.`);
  }

  const results = await Result.findAll({
    where: { gameId: game.id },
    order: [['createdAt', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (results.length === 0) {
    throw new Error(`Aucun résultat actif trouvé pour "${gameName}".`);
  }
  if (results.length > 1) {
    throw new Error(
      `Sécurité : ${results.length} résultats actifs trouvés pour "${gameName}". Intervention manuelle requise.`,
    );
  }

  const result = results[0];
  const validationEnd = new Date(
    result.createdAt.getTime() + validationWindowMinutes * 60 * 1000,
  );

  // Les tickets validés automatiquement ont été créés avant le résultat et
  // modifiés juste après sa création. La fenêtre est configurable pour les
  // gros volumes, sans englober par défaut les cycles historiques.
  const validatedTickets = await Ticket.findAll({
    where: {
      nomJeu: game.nom,
      isCart: false,
      statut: { [Op.in]: ['validé', 'invalidé'] },
      created: { [Op.lte]: result.createdAt },
      updatedAt: { [Op.between]: [result.createdAt, validationEnd] },
    },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  // Un ticket attribué a une nouvelle valeur updatedAt. On le rattache au
  // résultat grâce à dateAttribution, enregistrée dans le champ gains.
  const attributedForGame = await Ticket.findAll({
    where: {
      nomJeu: game.nom,
      isCart: false,
      statut: 'attribué',
      created: { [Op.lte]: result.createdAt },
    },
    order: [['id', 'ASC']],
    include: [{
      model: User,
      as: 'User',
      attributes: ['uniqueUserId', 'firstName', 'lastName', 'email'],
      required: false,
    }],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  const attributedTickets = attributedForGame.filter((ticket) => {
    const attributionDate = getGainAttributionDate(ticket);
    return attributionDate && attributionDate >= result.createdAt;
  });

  return { game, result, validatedTickets, attributedTickets, validationEnd };
}

function buildReport(incident, mode) {
  const { game, result, validatedTickets, attributedTickets, validationEnd } = incident;
  const statusCounts = validatedTickets.reduce((counts, ticket) => {
    counts[ticket.statut] = (counts[ticket.statut] || 0) + 1;
    return counts;
  }, {});

  return {
    mode,
    game: { id: game.id, name: game.nom, status: game.statut },
    result: {
      id: result.id,
      numbers: result.numbers,
      numbers2: result.numbers2,
      createdAt: result.createdAt,
    },
    validationWindowEnd: validationEnd,
    ticketsToReset: validatedTickets.length + attributedTickets.length,
    statusCounts,
    ticketIdsToReset: validatedTickets.map((ticket) => ticket.id),
    attributedTickets: attributedTickets.map((ticket) => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      uniqueUserId: ticket.uniqueUserId,
      attributedGain: ticket.gains && ticket.gains.attribue,
      attributionDate: getGainAttributionDate(ticket),
    })),
    financialWarning: attributedTickets.length
      ? 'Les tickets attribués seront remis en attente, mais les gains déjà crédités ne seront pas débités.'
      : null,
  };
}

async function cancelWrongResult(options) {
  if (!options.apply) {
    const incident = await inspectIncident(options);
    return buildReport(incident, 'DRY_RUN');
  }

  const transaction = await sequelize.transaction();
  try {
    const incident = await inspectIncident({ ...options, transaction });
    const report = buildReport(incident, 'APPLY');

    if (
      incident.attributedTickets.length > 0 &&
      !options.acknowledgeCreditedGains
    ) {
      throw new Error(
        `${incident.attributedTickets.length} ticket(s) ont déjà reçu un gain. ` +
        'Relancez avec --acknowledge-credited-gains pour confirmer leur remise en attente sans débit automatique.',
      );
    }

    const ticketIds = [
      ...incident.validatedTickets.map((ticket) => ticket.id),
      ...incident.attributedTickets.map((ticket) => ticket.id),
    ];
    if (ticketIds.length === 0) {
      throw new Error('Aucun ticket lié à ce résultat n’a été identifié. Aucune modification effectuée.');
    }

    const [resetCount] = await Ticket.update(
      { statut: 'en attente' },
      { where: { id: { [Op.in]: ticketIds } }, transaction },
    );
    if (resetCount !== ticketIds.length) {
      throw new Error(
        `Sécurité : ${ticketIds.length} tickets attendus, ${resetCount} mis à jour.`,
      );
    }

    const deletedResultCount = await Result.destroy({
      where: { id: incident.result.id, gameId: incident.game.id },
      transaction,
    });
    if (deletedResultCount !== 1) {
      throw new Error('Sécurité : la suppression du résultat n’a pas été confirmée.');
    }

    await transaction.commit();
    return { ...report, resetCount, deletedResultCount };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

function printUsage() {
  console.log(`
Utilisation :
  npm run result:cancel -- <nomJeu>
  npm run result:cancel -- <nomJeu> --apply

Options :
  --apply                        Applique réellement le correctif
  --acknowledge-credited-gains   Accepte de remettre les tickets déjà payés en attente
                                sans débiter les gains crédités
  --window-minutes=N             Fenêtre de validation (15 minutes par défaut)
`);
}

if (require.main === module) {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(1);
  }

  cancelWrongResult(options)
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!options.apply) {
        console.log('\nSimulation uniquement : aucune donnée modifiée.');
        console.log(`Pour appliquer : npm run result:cancel -- ${options.gameName} --apply`);
        if (report.attributedTickets.length > 0) {
          console.log('Ajoutez --acknowledge-credited-gains après vérification des gains déjà versés.');
        }
      }
    })
    .catch((error) => {
      console.error(`Échec : ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { cancelWrongResult, inspectIncident, parseArguments, buildReport };
