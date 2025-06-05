const { Ticket } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/tickets', async (req, res) => {
    try {
      const { statut, date, search } = req.query;
      const where = {};

      // Filtre par statut
      if (statut) {
        where.statut = statut;
      }

      // Filtre par date (sur la date de création)
      if (date) {
        where.created = {
          [Op.gte]: new Date(date + 'T00:00:00'),
          [Op.lte]: new Date(date + 'T23:59:59')
        };
      }

      // Recherche sur nomJeu ou formule
      if (search) {
        where[Op.or] = [
          { nomJeu: { [Op.like]: `%${search}%` } },
          { formule: { [Op.like]: `%${search}%` } }
        ];
      }

      const tickets = await Ticket.findAll({
        where,
        order: [['created', 'DESC']]
      });

      res.json({
        message: "Liste filtrée des tickets.",
        data: tickets
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des tickets.", error });
    }
  });
};