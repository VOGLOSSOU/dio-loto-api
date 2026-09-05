const { sequelize, Game, Result, Ticket } = require('../db/sequelize');
const { Op } = require('sequelize');

const INCIDENT = Object.freeze({
  resultId: 5089,
  gameId: 21,
  gameName: 'benin18',
  wrongNumbers: '66 10 67 89 5',
  expectedResetCount: 90,
  attributedTicketIds: [174421],
});

/**
 * Correctif du faux résultat benin18 #5089.
 *
 * Sans --apply : audit en lecture seule (mode par défaut).
 * Avec --apply : remet les tickets validés/invalidés par ce résultat à
 * "en attente", puis supprime le résultat, dans une seule transaction.
 *
 * Le ticket déjà attribué #174421 est volontairement laissé intact : son gain
 * de 3 000 FCFA doit d'abord être régularisé et confirmé par un administrateur.
 */
async function fixWrongResultBenin18({ apply = false } = {}) {
  const transaction = await sequelize.transaction();

  try {
    const game = await Game.findByPk(INCIDENT.gameId, { transaction });
    if (!game || game.nom !== INCIDENT.gameName) {
      throw new Error(
        `Le gameId ${INCIDENT.gameId} ne correspond pas à ${INCIDENT.gameName}.`,
      );
    }

    const result = await Result.findByPk(INCIDENT.resultId, { transaction });
    if (!result) {
      throw new Error(`Result ${INCIDENT.resultId} introuvable (déjà supprimé ?).`);
    }
    if (result.gameId !== INCIDENT.gameId) {
      throw new Error(
        `Result ${INCIDENT.resultId}: gameId attendu ${INCIDENT.gameId}, trouvé ${result.gameId}.`,
      );
    }
    if (result.numbers.trim() !== INCIDENT.wrongNumbers) {
      throw new Error(
        `Result ${INCIDENT.resultId}: numéros attendus "${INCIDENT.wrongNumbers}", trouvés "${result.numbers}".`,
      );
    }

    // La validation automatique a mis à jour les tickets à la seconde exacte
    // de création du résultat. La borne supérieure absorbe seulement une
    // éventuelle différence de précision entre MariaDB et JavaScript.
    const validationEnd = new Date(result.createdAt.getTime() + 999);
    const resetCandidates = await Ticket.findAll({
      where: {
        nomJeu: INCIDENT.gameName,
        isCart: false,
        statut: { [Op.in]: ['validé', 'invalidé'] },
        updatedAt: { [Op.between]: [result.createdAt, validationEnd] },
      },
      order: [['id', 'ASC']],
      transaction,
      lock: apply ? transaction.LOCK.UPDATE : undefined,
    });

    if (resetCandidates.length !== INCIDENT.expectedResetCount) {
      throw new Error(
        `Sécurité: ${INCIDENT.expectedResetCount} tickets attendus, ${resetCandidates.length} trouvés. Aucune modification effectuée.`,
      );
    }

    const attributedTickets = await Ticket.findAll({
      where: { id: { [Op.in]: INCIDENT.attributedTicketIds } },
      transaction,
      lock: apply ? transaction.LOCK.UPDATE : undefined,
    });
    if (
      attributedTickets.length !== INCIDENT.attributedTicketIds.length ||
      attributedTickets.some((ticket) =>
        ticket.nomJeu !== INCIDENT.gameName || ticket.statut !== 'attribué'
      )
    ) {
      throw new Error(
        'Sécurité: le ticket déjà attribué ne correspond plus à l’état audité. Aucune modification effectuée.',
      );
    }

    const report = {
      mode: apply ? 'APPLY' : 'DRY_RUN',
      result: {
        id: result.id,
        gameId: result.gameId,
        gameName: game.nom,
        numbers: result.numbers,
        createdAt: result.createdAt,
      },
      ticketsToReset: resetCandidates.length,
      ticketIdsToReset: resetCandidates.map((ticket) => ticket.id),
      attributedTicketsUntouched: attributedTickets.map((ticket) => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        uniqueUserId: ticket.uniqueUserId,
        gains: ticket.gains,
      })),
    };

    if (!apply) {
      await transaction.rollback();
      return report;
    }

    const [resetCount] = await Ticket.update(
      { statut: 'en attente' },
      {
        where: { id: { [Op.in]: resetCandidates.map((ticket) => ticket.id) } },
        transaction,
      },
    );
    if (resetCount !== INCIDENT.expectedResetCount) {
      throw new Error(
        `Sécurité: ${INCIDENT.expectedResetCount} mises à jour attendues, ${resetCount} réalisées.`,
      );
    }

    const deletedResultCount = await Result.destroy({
      where: { id: INCIDENT.resultId, gameId: INCIDENT.gameId },
      transaction,
    });
    if (deletedResultCount !== 1) {
      throw new Error(`Sécurité: suppression du Result ${INCIDENT.resultId} non confirmée.`);
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

if (require.main === module) {
  const apply = process.argv.includes('--apply');

  fixWrongResultBenin18({ apply })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!apply) {
        console.log('\nSimulation uniquement. Relancer avec --apply pour appliquer le correctif.');
      }
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error('Échec du correctif:', error.stack || error.message || error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { fixWrongResultBenin18 };
