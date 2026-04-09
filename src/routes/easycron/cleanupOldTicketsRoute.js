const { Ticket } = require('../../db/sequelize');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

module.exports = (app) => {
  app.get('/api/cleanup-old-tickets', async (req, res) => {
    try {
      const cutoffDate = moment().subtract(72, 'hours').toDate();

      const nbDeleted = await Ticket.destroy({
        where: { created: { [Op.lt]: cutoffDate } }
      });

      console.log(`[CLEANUP] ${nbDeleted} ticket(s) supprimé(s) (>72h)`);

      res.status(200).json({
        message: `Nettoyage terminé. ${nbDeleted} ticket(s) supprimé(s).`,
        nbDeleted,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur nettoyage tickets :', error.message);
      res.status(500).json({ message: 'Erreur lors du nettoyage.', error: error.message });
    }
  });
};