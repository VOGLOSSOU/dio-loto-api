const { Ticket, User, Notification, sequelize } = require('../../db/sequelize');

// Liste des jeux Côte d'Ivoire à traitement spécial
const specialCIVGames = [
  'coteivoire7', 'coteivoire21', 'coteivoire22', 'coteivoire23', 'coteivoire1', 'coteivoire3'
];

module.exports = (app) => {
  /**
   * POST /api/tickets/:ticketId/assign-gain
   * Body: { gain: number }
   * Attribue le gain au user selon les règles métier.
   */
  app.post('/api/tickets/:ticketId/assign-gain', async (req, res) => {
    // Démarrage de la transaction pour cohérence
    const t = await sequelize.transaction();

    try {
      const { ticketId } = req.params;
      const { gain } = req.body;

      console.log(`🎫 Attribution de gain - Ticket: ${ticketId}, Gain: ${gain}`);

      if (!gain || isNaN(gain) || gain <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "Le gain à attribuer est requis et doit être positif." });
      }

      // 1. Récupérer le ticket
      const ticket = await Ticket.findByPk(ticketId, { transaction: t });
      if (!ticket) {
        await t.rollback();
        return res.status(404).json({ message: "Ticket non trouvé." });
      }

      console.log(`📋 Statut actuel du ticket: ${ticket.statut}`);

      if (ticket.statut === 'attribué') {
        await t.rollback();
        return res.status(400).json({ message: "Le gain a déjà été attribué pour ce ticket." });
      }
      if (ticket.statut !== 'validé') {
        await t.rollback();
        return res.status(400).json({ message: "Le ticket n'est pas validé." });
      }

      // 2. Récupérer l'utilisateur
      const user = await User.findOne({
        where: { uniqueUserId: ticket.uniqueUserId },
        transaction: t
      });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      console.log(`👤 Utilisateur trouvé: ${user.firstName} ${user.lastName}`);

      // 3. Appliquer la règle de répartition du gain
      let soldeToAdd = 0;
      let gainToAdd = 0;
      if (specialCIVGames.includes(ticket.nomJeu)) {
        soldeToAdd = Math.round(gain * 0.6 * 100) / 100; // 60%
        gainToAdd = Math.round(gain * 0.4 * 100) / 100;  // 40%
        console.log(`🇨🇮 Jeu Côte d'Ivoire: ${soldeToAdd} FCFA solde + ${gainToAdd} FCFA gain`);
      } else {
        soldeToAdd = 0;
        gainToAdd = gain;
        console.log(`🎯 Autre jeu: ${gainToAdd} FCFA gain`);
      }

      // 4. Mettre à jour l'utilisateur
      const oldUserSolde = user.solde;
      const oldUserGain = user.gain;

      user.gain += gainToAdd;
      user.solde += soldeToAdd;
      await user.save({ transaction: t });

      console.log(`💰 Utilisateur mis à jour: Solde ${oldUserSolde} → ${user.solde}, Gain ${oldUserGain} → ${user.gain}`);

      // 5. Mettre à jour le ticket
      let currentGains = ticket.gains;
      if (typeof currentGains === 'string') {
        try {
          currentGains = JSON.parse(currentGains);
        } catch {
          currentGains = { original: currentGains };
        }
      }

      // Ajouter le gain attribué à la structure existante
      const updatedGains = {
        ...currentGains,
        attribue: gain,
        dateAttribution: new Date().toISOString()
      };

      ticket.gains = updatedGains;
      ticket.statut = 'attribué';
      await ticket.save({ transaction: t });

      console.log(`✅ Ticket mis à jour: Statut → 'attribué'`);

      // 6. Créer une notification pour l'utilisateur
      let notificationMessage = '';
      if (specialCIVGames.includes(ticket.nomJeu)) {
        notificationMessage = `Félicitations ! Un gain de ${gain} FCFA a été attribué à votre ticket n°${ticket.numeroTicket}. Répartition : ${soldeToAdd} FCFA ajoutés à votre solde principal et ${gainToAdd} FCFA ajoutés à votre solde gain.`;
      } else {
        notificationMessage = `Félicitations ! Un gain de ${gain} FCFA a été attribué à votre ticket n°${ticket.numeroTicket} et ajouté à votre solde gain.`;
      }

      await Notification.create({
        userId: user.uniqueUserId,
        type: 'gain_attribue',
        title: 'Gain attribué à votre ticket',
        message: notificationMessage
      }, { transaction: t });

      console.log(`📢 Notification créée pour l'utilisateur`);

      // Commit de la transaction
      await t.commit();

      console.log(`🎉 Attribution de gain terminée avec succès`);

      res.status(200).json({
        message: "Gain attribué avec succès.",
        details: {
          gainAttribue: gain,
          repartition: {
            soldeAjoute: soldeToAdd,
            gainAjoute: gainToAdd
          },
          nouveauSoldeUtilisateur: user.solde,
          nouveauGainUtilisateur: user.gain
        },
        ticket: {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          statut: ticket.statut,
          gains: ticket.gains
        },
        user: {
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          solde: user.solde,
          gain: user.gain
        }
      });

    } catch (error) {
      await t.rollback();
      console.error('❌ Erreur lors de l\'attribution du gain:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        message: "Erreur lors de l'attribution du gain.",
        error: error.message
      });
    }
  });
};