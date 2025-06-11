const { AdminToUserTransaction, Admin, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/transactions/admin-to-user', auth, async (req, res) => {
    try {
      const transactions = await AdminToUserTransaction.findAll({
        include: [
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['date', 'DESC']]
      });

      res.status(200).json({
        message: 'Liste des recharges admin → utilisateur récupérée avec succès.',
        count: transactions.length,
        transactions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions admin-to-user :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la récupération des transactions.',
        error
      });
    }
  });
};