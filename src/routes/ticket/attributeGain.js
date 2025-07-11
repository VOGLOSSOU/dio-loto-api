const { Ticket, User, Notification } = require('../../db/sequelize');

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
    try {
      const { ticketId } = req.params;
      const { gain } = req.body;

      if (!gain || isNaN(gain) || gain <= 0) {
        return res.status(400).json({ message: "Le gain à attribuer est requis et doit être positif." });
      }

      // 1. Récupérer le ticket
      const ticket = await Ticket.findByPk(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket non trouvé." });
      }
      
if (ticket.statut === 'attribué') {
  return res.status(400).json({ message: "Le gain a déjà été attribué pour ce ticket." });
}
if (ticket.statut !== 'validé') {
  return res.status(400).json({ message: "Le ticket n'est pas validé." });
}

      // 2. Récupérer l'utilisateur
      const user = await User.findOne({ where: { uniqueUserId: ticket.uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // 3. Appliquer la règle de répartition du gain
      let soldeToAdd = 0;
      let gainToAdd = 0;
      if (specialCIVGames.includes(ticket.nomJeu)) {
        soldeToAdd = Math.round(gain * 0.6 * 100) / 100; // 60%
        gainToAdd = Math.round(gain * 0.4 * 100) / 100;  // 40%
      } else {
        soldeToAdd = 0;
        gainToAdd = gain;
      }

      // 4. Mettre à jour l'utilisateur
      user.gain += gainToAdd;
      user.solde += soldeToAdd;
      await user.save();

      // 5. Mettre à jour le ticket (pour ne plus le proposer à l’admin)
      // Récupérer les gains existants et ajouter le gain attribué
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
      await ticket.save();

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
      });

      res.status(200).json({
        message: "Gain attribué avec succès.",
        ticket,
        user
      });
    } catch (error) {
      console.error('Erreur lors de l’attribution du gain :', error);
      res.status(500).json({ message: "Erreur lors de l’attribution du gain.", error: error.message });
    }
  });
};