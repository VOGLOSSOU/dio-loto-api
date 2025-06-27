const { Transaction, Admin, Reseller, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/transactions/admin-recharges', auth, async (req, res) => {
    try {
      const transactions = await Transaction.findAll({
        where: { type: 'admin-to-reseller' },
        order: [['date', 'DESC']],
        include: [
          { model: Admin, as: 'admin', attributes: ['firstName', 'lastName', 'email'] },
          {
            model: Reseller,
            as: 'reseller',
            attributes: ['uniqueResellerId', 'soldeRevendeur', 'status'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      });

      res.json({
        message: 'Liste des recharges faites par les admins aux revendeurs.',
        data: transactions
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des transactions.", error });
    }
  });
};