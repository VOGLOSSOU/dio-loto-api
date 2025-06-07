const { Op } = require('sequelize');
const {
  Transaction,
  ResellerToUserTransaction,
  Ticket,
  Admin,
  Reseller,
  User
} = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * GET /api/dashboard/latest
   *
   * Renvoie :
   *  • lastResellerRecharge : dernière recharge d’un revendeur (admin → revendeur)
   *  • lastUserRecharge     : dernière recharge utilisateur (revendeur → utilisateur)
   *  • lastTicket           : dernier ticket créé
   */
  app.get('/api/dashboard/latest', auth, async (req, res) => {
    try {
      // 1) Dernière recharge revendeur (Transaction admin→revendeur)
      const lastResellerRecharge = await Transaction.findOne({
        order: [['created', 'DESC']],
        include: [
          { model: Admin, as: 'admin', attributes: ['firstName','lastName'] },
          { 
            model: Reseller, 
            as: 'reseller', 
            attributes: ['uniqueResellerId','whatsapp'],
            include: [{ model: User, as: 'user', attributes: ['firstName','lastName'] }]
          }
        ]
      });

      // 2) Dernière recharge utilisateur (ResellerToUserTransaction revendeur→utilisateur)
      const lastUserRecharge = await ResellerToUserTransaction.findOne({
        where: { status: 'validé' },
        order: [['created', 'DESC']],
        include: [
          {
            model: Reseller,
            as: 'reseller',
            include: [{ model: User, as: 'user', attributes: ['firstName','lastName'] }],
            attributes: ['uniqueResellerId']
          },
          { model: User, as: 'user', attributes: ['firstName','lastName'] }
        ]
      });

      // 3) Dernier ticket créé
      const lastTicket = await Ticket.findOne({
        order: [['created', 'DESC']],
        include: [
          { model: User, as: 'User', attributes: ['firstName','lastName'] }
        ],
        attributes: ['id','created','mise','nomJeu']
      });

      return res.status(200).json({
        message: 'Dernières activités clés',
        data: {
          lastResellerRecharge,
          lastUserRecharge,
          lastTicket
        }
      });
    } catch (error) {
      console.error('Erreur dans /api/dashboard/latest :', error);
      return res.status(500).json({
        message: 'Une erreur est survenue.',
        error: error.message
      });
    }
  });
};