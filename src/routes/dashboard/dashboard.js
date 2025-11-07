// routes/dashboard/dashboard.js

const { Op } = require('sequelize');
const {
  SoldeInitial,
  ResellerToUserTransaction,
  Ticket,
  User,
  Withdrawal,
  WithdrawalHistory
} = require('../../db/sequelize');
const auth = require('../../auth/auth');
const moment = require('moment-timezone');

module.exports = (app) => {
  /**
   * GET /api/dashboard/summary
   *
   * Renvoie les métriques suivantes :
   *  - totalBalance       : somme de SoldeInitial.montant moins somme de ResellerToUserTransaction.money (status = 'validé')
   *  - todaysRecharges    : somme de ResellerToUserTransaction.money (status = 'validé') pour aujourd'hui
   *  - totalUserGains     : somme des retraits traités (Withdrawal.montant où statut = 'traité')
   *  - ticketsPlayedToday : nombre de Ticket créés aujourd'hui
   */
  app.get('/api/dashboard/summary', auth, async (req, res) => {
    try {
      // 1) Somme de tous les montants injectés
      const totalInjected = await SoldeInitial.sum('montant');
      // 2) Somme des montants distribués (recharges validées)
      const totalDistributed = await ResellerToUserTransaction.sum('money', {
        where: { status: 'validé' }
      });
      const totalBalance = (totalInjected || 0) - (totalDistributed || 0);

      // Bornes de la journée en cours selon l'heure du Bénin (Africa/Porto-Novo)
      const startOfDay = moment().tz('Africa/Porto-Novo');
      startOfDay.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const endOfDay = moment().tz('Africa/Porto-Novo');
      endOfDay.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

      // 3) Somme des recharges validées aujourd'hui
      const todaysRecharges = await ResellerToUserTransaction.sum('money', {
        where: {
          status: 'validé',
          created: {
            [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
          }
        }
      });

      // 4) Gain global des utilisateurs (somme des retraits traités + historique)
      const totalProcessedWithdrawals = await Withdrawal.sum('montant', {
        where: { statut: 'traité' }
      });
      const totalArchivedWithdrawals = await WithdrawalHistory.sum('montant');
      const totalUserGains = (totalProcessedWithdrawals || 0) + (totalArchivedWithdrawals || 0);

      // 5) Nombre de tickets joués aujourd'hui
      const ticketsPlayedToday = await Ticket.count({
        where: {
          created: {
            [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
          }
        }
      });

      return res.status(200).json({
        message: 'Résumé du tableau de bord',
        data: {
          totalBalance: totalBalance || 0,
          todaysRecharges: todaysRecharges || 0,
          totalUserGains: totalUserGains || 0,
          ticketsPlayedToday: ticketsPlayedToday || 0
        }
      });
    } catch (error) {
      console.error('Erreur dans /api/dashboard/summary :', error);
      return res.status(500).json({
        message: 'Une erreur est survenue lors de la récupération du résumé.',
        error: error.message
      });
    }
  });
};