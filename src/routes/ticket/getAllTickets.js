const { Ticket, User } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/tickets', async (req, res) => {
    try {
      const { statut, date, search } = req.query;

      // Construction dynamique des filtres
      const where = {
        [Op.and]: []
      };

      // Filtre par statut
      if (statut) {
        where[Op.and].push({ statut });
      }

      // Filtre par date (ex: "2025-07-09")
      if (date) {
        where[Op.and].push({
          created: {
            [Op.gte]: new Date(date + 'T00:00:00'),
            [Op.lte]: new Date(date + 'T23:59:59'),
          }
        });
      }

      // Filtre par nomJeu ou formule contenant le mot-clé
      if (search) {
        where[Op.and].push({
          [Op.or]: [
            { nomJeu:  { [Op.like]: `%${search}%` } },
            { formule: { [Op.like]: `%${search}%` } },
          ]
        });
      }

      const tickets = await Ticket.findAll({
        where,
        order: [['created', 'DESC']],
        include: [
          {
            model: User,
            as: 'User',
            attributes: [
              'uniqueUserId',
              'firstName',
              'lastName',
              'email',
              'solde',
              'gain'
            ]
          }
        ]
      });

      res.json({
        message: "Liste filtrée des tickets (avec infos utilisateur).",
        data: tickets
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Erreur lors de la récupération des tickets.",
        error: error.message
      });
    }
  });
};