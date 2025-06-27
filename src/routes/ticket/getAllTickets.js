// routes/ticketRoutes.js (ou là où vous avez défini votre GET /api/tickets)
const { Ticket, User } = require('../../db/sequelize');
const { Op }         = require('sequelize');

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
          [Op.lte]: new Date(date + 'T23:59:59'),
        };
      }

      // Recherche sur nomJeu ou formule
      if (search) {
        where[Op.or] = [
          { nomJeu:   { [Op.like]: `%${search}%` } },
          { formule:  { [Op.like]: `%${search}%` } },
        ];
      }

      // On récupère tous les tickets qui correspondent, en triant par date décroissante,
      //  ET on inclut en jointure les infos du User correspondant à ticket.uniqueUserId.
      const tickets = await Ticket.findAll({
        where,
        order: [['created', 'DESC']],
        include: [
          {
            model: User,
            as:    'User', // doit matcher l’alias défini dans Ticket.belongsTo(User, { as: 'User', … })
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

      // Sequelize renverra chaque élément “ticket” avec une propriété .User
      // contenant { uniqueUserId, firstName, lastName, email, solde, gain } si trouvé,
      // ou null si l’user n’existe pas.
      res.json({
        message: "Liste filtrée des tickets (avec infos utilisateur).",
        data: tickets
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Erreur lors de la récupération des tickets.",
        error:   error.message
      });
    }
  });
};