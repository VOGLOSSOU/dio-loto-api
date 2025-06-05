const { Ticket } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/tickets', async (req, res) => {
    try {
      const tickets = await Ticket.findAll({
        order: [['created', 'DESC']]
      });
      res.json({
        message: "Liste complète des tickets.",
        data: tickets
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des tickets.", error });
    }
  });
};