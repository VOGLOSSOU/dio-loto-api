const { Ticket, User } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/tickets/user/:uniqueUserId/cart', async (req, res) => {
    try {
      const { uniqueUserId } = req.params;

      if (!uniqueUserId) {
        return res.status(400).json({ message: "L'identifiant utilisateur est requis." });
      }

      // Vérifier que l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Récupérer les tickets en panier
      const tickets = await Ticket.findAll({
        where: { uniqueUserId, isCart: true },
        order: [['created', 'DESC']]
      });

      res.status(200).json({
        message: tickets.length === 0 ? "Aucun ticket en panier pour cet utilisateur." : "Tickets en panier récupérés avec succès.",
        tickets
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets en panier :', error);
      res.status(500).json({ message: "Erreur lors de la récupération des tickets en panier.", error: error.message });
    }
  });
};