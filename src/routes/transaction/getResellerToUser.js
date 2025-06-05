const { Transaction, Reseller, User } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user', async (req, res) => {
    try {
      const { status, date, search } = req.query;
      const where = { type: 'reseller-to-user' };

      // Filtre par statut
      if (status) {
        where.status = status;
      }

      // Filtre par date (sur la date de création)
      if (date) {
        where.created = {
          [Op.gte]: new Date(date + 'T00:00:00'),
          [Op.lte]: new Date(date + 'T23:59:59')
        };
      }

      // Préparation du include pour recherche sur noms
      const include = [
        {
          model: Reseller,
          as: 'reseller',
          include: [
            { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }
          ]
        },
        {
          model: User,
          as: 'receiverUser',
          attributes: ['firstName', 'lastName', 'email']
        }
      ];

      // Recherche par nom/prénom du sender (revendeur) ou receiver (user)
      if (search) {
        include[0].include[0].where = {
          [Op.or]: [
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } }
          ]
        };
        include[1].where = {
          [Op.or]: [
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      const transactions = await Transaction.findAll({
        where,
        order: [['created', 'DESC']],
        include
      });

      res.json({
        message: "Liste des transactions reseller-to-user.",
        data: transactions
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des transactions.", error });
    }
  });
};