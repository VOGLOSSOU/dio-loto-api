const { UserToUserTransaction, User } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/transactions/user-to-user', async (req, res) => {
    try {
      const { status, date } = req.query;
      const where = {};

      if (status) where.status = status;
      if (date) {
        where.created = {
          [Op.gte]: new Date(date + 'T00:00:00'),
          [Op.lte]: new Date(date + 'T23:59:59')
        };
      }

      const transactions = await UserToUserTransaction.findAll({
        where,
        order: [['created', 'DESC']],
        include: [
          {
            model: User,
            as: 'senderUser',
            attributes: ['uniqueUserId', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'receiverUser',
            attributes: ['uniqueUserId', 'firstName', 'lastName', 'email']
          }
        ]
      });

      res.json({
        message: "Liste des transactions user-to-user avec infos utilisateurs.",
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la récupération des transactions user-to-user.",
        error
      });
    }
  });
};