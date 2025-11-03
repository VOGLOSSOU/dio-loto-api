const { Ticket } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/tickets/counts', async (req, res) => {
    try {
      const total = await Ticket.count();
      const enAttente = await Ticket.count({ where: { statut: 'en attente', isCart: false } });
      const valides = await Ticket.count({ where: { statut: 'validé', isCart: false } });
      const invalides = await Ticket.count({ where: { statut: 'invalidé', isCart: false } });
      const attribues = await Ticket.count({ where: { statut: 'attribué' } });

      res.json({
        total,
        enAttente,
        valides,
        invalides,
        attribues
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du comptage des tickets.", error });
    }
  });
};