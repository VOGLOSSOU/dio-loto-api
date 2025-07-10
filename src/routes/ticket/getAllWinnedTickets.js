const { Ticket, Game, User } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  /**
   * GET /api/tickets/winners?country=Benin
   * Retourne tous les tickets gagnants (statut "validé") pour un pays donné,
   * avec toutes les infos nécessaires pour l’admin.
   */
  app.get('/api/tickets/winners', async (req, res) => {
    try {
      const { country } = req.query;

      if (!country) {
        return res.status(400).json({ message: "Le pays est requis en paramètre (country)." });
      }

      // On récupère les jeux du pays demandé
      const games = await Game.findAll({ where: { pays: country } });
      if (!games || games.length === 0) {
        return res.status(404).json({ message: "Aucun jeu trouvé pour ce pays." });
      }
      const gameNames = games.map(g => g.nom);

      // On récupère tous les tickets gagnants (statut "attribué", pas dans le panier, jeu du pays)
      const tickets = await Ticket.findAll({
        where: {
          nomJeu: { [Op.in]: gameNames }, // Correction : utiliser Op.in pour chercher dans un tableau
          statut: 'validé', // Les tickets gagnants qui attendent l'attribution de gain
          isCart: false
        },
        include: [{
          model: User,
          as: 'User', // Utiliser l'association existante
          attributes: ['uniqueUserId', 'firstName', 'lastName', 'email', 'solde', 'gain']
        }],
        order: [['created', 'DESC']]
      });

    //   Optionnel : enrichir avec infos user (si tu veux afficher le nom/prénom/email)
      const ticketsWithUser = await Promise.all(tickets.map(async ticket => {
        const user = await User.findOne({ where: { uniqueUserId: ticket.uniqueUserId } });
        return { ...ticket.toJSON(), user: user ? user.toJSON() : null };
      }));

      res.status(200).json({
        message: tickets.length === 0 ? "Aucun ticket gagnant pour ce pays." : "Tickets gagnants récupérés avec succès.",
        tickets: ticketsWithUser
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets gagnants :', error);
      res.status(500).json({ message: "Erreur lors de la récupération des tickets gagnants.", error: error.message });
    }
  });
};