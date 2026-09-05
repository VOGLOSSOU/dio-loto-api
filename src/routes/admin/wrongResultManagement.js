const { sequelize, Game, Result, Ticket, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const adminAuth = require('../../auth/adminAuth');
const { inspectIncident } = require('../../scripts/cancelWrongResult');

const VALID_COUNTRIES = ['Benin', "Côte d'Ivoire", 'Ghana', 'France', 'Togo'];
const VALIDATION_WINDOW_MINUTES = 15;

function validateSelection(pays, nomJeu) {
  if (!pays || !nomJeu) {
    return 'Le pays et le nom du jeu sont requis.';
  }
  if (!VALID_COUNTRIES.includes(pays)) {
    return 'Pays invalide.';
  }
  return null;
}

function formatAnalysis(incident) {
  const { game, result, validatedTickets, attributedTickets } = incident;
  const validTickets = validatedTickets.filter((ticket) => ticket.statut === 'validé');
  const invalidTickets = validatedTickets.filter((ticket) => ticket.statut === 'invalidé');

  return {
    jeu: {
      id: game.id,
      nom: game.nom,
      pays: game.pays,
      statut: game.statut,
    },
    resultat: {
      id: result.id,
      numbers: result.numbers,
      numbers2: result.numbers2,
      createdAt: result.createdAt,
    },
    impact: {
      totalTicketsTouches:
        validTickets.length + invalidTickets.length + attributedTickets.length,
      ticketsQuiSerontRemisEnAttente: validTickets.length + invalidTickets.length,
      ticketsValides: validTickets.length,
      ticketsInvalides: invalidTickets.length,
      ticketsDejaAttribues: attributedTickets.length,
    },
    tickets: {
      valides: validTickets.map(formatTicket),
      invalides: invalidTickets.map(formatTicket),
      attribues: attributedTickets.map((ticket) => ({
        ...formatTicket(ticket),
        joueur: formatPlayer(ticket.User),
        gainAttribue: ticket.gains && ticket.gains.attribue,
        dateAttribution: ticket.gains && ticket.gains.dateAttribution,
        ligneACopier: formatCopyLine(ticket),
      })),
    },
    avertissement: attributedTickets.length > 0
      ? "Les tickets déjà attribués et les gains crédités ne seront pas modifiés lors de l'annulation."
      : null,
  };
}

function formatPlayer(user) {
  if (!user) return null;
  return {
    uniqueUserId: user.uniqueUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
  };
}

function formatCopyLine(ticket) {
  const playerName = ticket.User
    ? `${ticket.User.firstName} ${ticket.User.lastName}`.trim()
    : 'Joueur introuvable';
  const attributedGain = ticket.gains && ticket.gains.attribue != null
    ? ticket.gains.attribue
    : 0;
  return `${ticket.id} | ${ticket.numeroTicket} | ${playerName} | ${attributedGain} FCFA`;
}

function formatTicket(ticket) {
  return {
    id: ticket.id,
    numeroTicket: ticket.numeroTicket,
    uniqueUserId: ticket.uniqueUserId,
    statut: ticket.statut,
    mise: ticket.mise,
    gains: ticket.gains,
    created: ticket.created,
    updatedAt: ticket.updatedAt,
  };
}

module.exports = (app) => {
  // Étape 1 : analyse en lecture seule avant confirmation par l'admin.
  app.get('/api/admin/wrong-results/analysis', adminAuth, async (req, res) => {
    try {
      const { pays, nomJeu } = req.query;
      const validationError = validateSelection(pays, nomJeu);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const incident = await inspectIncident({
        gameName: nomJeu,
        validationWindowMinutes: VALIDATION_WINDOW_MINUTES,
      });
      if (incident.game.pays !== pays) {
        return res.status(400).json({
          message: `Le jeu "${nomJeu}" n'appartient pas au pays "${pays}".`,
        });
      }

      return res.status(200).json({
        message: 'Analyse terminée. Aucune donnée n’a été modifiée.',
        data: formatAnalysis(incident),
      });
    } catch (error) {
      if (error.message.includes('introuvable') || error.message.includes('Aucun résultat')) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Erreur lors de l'analyse du résultat :", error);
      return res.status(500).json({
        message: "Une erreur est survenue pendant l'analyse.",
        error: error.message,
      });
    }
  });

  // Étape 2 : annulation confirmée du résultat analysé.
  app.delete('/api/admin/wrong-results/:resultId', adminAuth, async (req, res) => {
    const { pays, nomJeu } = req.body;
    const resultId = Number(req.params.resultId);
    const validationError = validateSelection(pays, nomJeu);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    if (!Number.isInteger(resultId) || resultId <= 0) {
      return res.status(400).json({ message: "L'identifiant du résultat est invalide." });
    }

    const transaction = await sequelize.transaction();
    try {
      const incident = await inspectIncident({
        gameName: nomJeu,
        validationWindowMinutes: VALIDATION_WINDOW_MINUTES,
        transaction,
      });

      if (incident.game.pays !== pays) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Le jeu "${nomJeu}" n'appartient pas au pays "${pays}".`,
        });
      }
      if (incident.result.id !== resultId) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Le résultat actif a changé depuis l'analyse. Relancez l'analyse avant de confirmer.",
          resultIdAnalyse: resultId,
          resultIdActuel: incident.result.id,
        });
      }

      const ticketIds = incident.validatedTickets.map((ticket) => ticket.id);
      let resetCount = 0;
      if (ticketIds.length > 0) {
        [resetCount] = await Ticket.update(
          { statut: 'en attente' },
          {
            where: {
              id: { [Op.in]: ticketIds },
              statut: { [Op.in]: ['validé', 'invalidé'] },
            },
            transaction,
          },
        );
      }
      if (resetCount !== ticketIds.length) {
        throw new Error(
          `Sécurité : ${ticketIds.length} tickets attendus, ${resetCount} remis en attente.`,
        );
      }

      const deletedResultCount = await Result.destroy({
        where: { id: resultId, gameId: incident.game.id },
        transaction,
      });
      if (deletedResultCount !== 1) {
        throw new Error("La suppression du résultat n'a pas été confirmée.");
      }

      await transaction.commit();
      return res.status(200).json({
        message: 'Le résultat a été supprimé et les tickets concernés ont été remis en attente.',
        data: {
          resultatSupprime: resultId,
          jeu: { id: incident.game.id, nom: incident.game.nom, pays: incident.game.pays },
          ticketsRemisEnAttente: resetCount,
          ticketsAttribuesNonModifies: incident.attributedTickets.map((ticket) => ({
            id: ticket.id,
            numeroTicket: ticket.numeroTicket,
            uniqueUserId: ticket.uniqueUserId,
            joueur: formatPlayer(ticket.User),
            gainAttribue: ticket.gains && ticket.gains.attribue,
            ligneACopier: formatCopyLine(ticket),
          })),
        },
      });
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      if (error.message.includes('introuvable') || error.message.includes('Aucun résultat')) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Erreur lors de l'annulation du résultat :", error);
      return res.status(500).json({
        message: "L'annulation a échoué. Aucune modification partielle n'a été conservée.",
        error: error.message,
      });
    }
  });

  // Étape 3, volontairement séparée : remise en attente des tickets déjà payés.
  // Le solde gain du joueur n'est jamais débité par cette route.
  app.patch('/api/admin/wrong-results/attributed-tickets/reset', adminAuth, async (req, res) => {
    const { pays, nomJeu, ticketIds } = req.body;
    const validationError = validateSelection(pays, nomJeu);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        message: 'ticketIds doit être une liste non vide d’identifiants de tickets.',
      });
    }

    const normalizedIds = [...new Set(ticketIds.map(Number))];
    if (normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ message: 'Un ou plusieurs identifiants de tickets sont invalides.' });
    }

    const transaction = await sequelize.transaction();
    try {
      const game = await Game.findOne({
        where: { nom: nomJeu, pays },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!game) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Jeu introuvable pour le pays sélectionné.' });
      }

      const tickets = await Ticket.findAll({
        where: { id: { [Op.in]: normalizedIds } },
        include: [{
          model: User,
          as: 'User',
          attributes: ['uniqueUserId', 'firstName', 'lastName', 'email'],
          required: false,
        }],
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (tickets.length !== normalizedIds.length) {
        throw new Error(
          `Sécurité : ${normalizedIds.length} tickets demandés, ${tickets.length} trouvés.`,
        );
      }
      const incompatibleTicket = tickets.find(
        (ticket) => ticket.nomJeu !== game.nom || ticket.statut !== 'attribué',
      );
      if (incompatibleTicket) {
        throw new Error(
          `Sécurité : le ticket ${incompatibleTicket.id} n'est pas un ticket attribué de ${game.nom}.`,
        );
      }

      // Généré avant la modification afin de conserver la preuve du statut payé.
      const manualProcessingLines = tickets.map(formatCopyLine);
      const ticketDetails = tickets.map((ticket) => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        joueur: formatPlayer(ticket.User),
        gainAttribue: ticket.gains && ticket.gains.attribue,
        ligneACopier: formatCopyLine(ticket),
      }));

      const [resetCount] = await Ticket.update(
        { statut: 'en attente' },
        {
          where: { id: { [Op.in]: normalizedIds }, statut: 'attribué', nomJeu: game.nom },
          transaction,
        },
      );
      if (resetCount !== normalizedIds.length) {
        throw new Error(
          `Sécurité : ${normalizedIds.length} tickets attendus, ${resetCount} remis en attente.`,
        );
      }

      await transaction.commit();
      return res.status(200).json({
        message: 'Les tickets attribués sélectionnés ont été remis en attente. Aucun gain n’a été débité.',
        data: {
          ticketsRemisEnAttente: resetCount,
          tickets: ticketDetails,
          lignesACopier: manualProcessingLines,
          texteACopier: manualProcessingLines.join('\n'),
          traitementFinancierManuelRequis: true,
        },
      });
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error('Erreur lors de la remise en attente des tickets attribués :', error);
      return res.status(400).json({
        message: 'Aucun ticket attribué n’a été modifié.',
        error: error.message,
      });
    }
  });
};
