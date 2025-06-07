// routes/resellers.js

const { Op, fn, col, literal } = require('sequelize');
const { ResellerToUserTransaction, Reseller, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/topResellers', auth, async (req, res) => {
    try {
      const top = await ResellerToUserTransaction.findAll({
        where: { status: 'validé' },
        attributes: [
          'sender',
          [fn('COUNT', col('ResellerToUserTransaction.id')), 'userCount'],
          [fn('SUM', col('ResellerToUserTransaction.money')), 'totalRecharges']
        ],
        group: ['sender'],
        order: [[literal('totalRecharges'), 'DESC']],
        limit: 3,
        include: [{
          model: Reseller,
          as: 'reseller',
          attributes: ['uniqueResellerId', 'status', 'whatsapp'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }]
      });

      const data = top.map(row => {
        const r = row.reseller;
        const u = r.user || {};
        return {
          uniqueResellerId: r.uniqueResellerId,
          firstName: u.firstName,
          lastName: u.lastName,
          phoneNumber: u.whatsapp || r.whatsapp,
          totalRecharges: Number(row.get('totalRecharges')) || 0,
          userCount: Number(row.get('userCount')) || 0,
          status: r.status
        };
      });

      res.status(200).json({ message: 'Top 3 des revendeurs', data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  });
};