const { ResellerToUserTransaction, Ticket, Withdrawal, sequelize } = require("../../db/sequelize")
const { Op, fn, col, literal } = require('sequelize')
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/dashboard/profit', auth, async (req, res) => {
    try {
      console.log('💰 Calcul des bénéfices totaux...')

      // 1) Calculer la somme totale des recharges revendeur → utilisateur
      const totalRechargesResult = await ResellerToUserTransaction.findAll({
        attributes: [
          [fn('SUM', col('money')), 'totalRecharges']
        ],
        where: {
          status: 'validé' // Uniquement les transactions validées
        },
        raw: true
      })

      const totalRecharges = parseFloat(totalRechargesResult[0]?.totalRecharges || 0)
      console.log(`💸 Total recharges revendeur→user: ${totalRecharges} FCFA`)

      // 2) Calculer la somme totale des retraits traités (ARGENT SORTANT)
      const totalWithdrawalsResult = await Withdrawal.findAll({
        attributes: [
          [fn('SUM', col('montant')), 'totalWithdrawals']
        ],
        where: {
          statut: 'traité' // Uniquement les retraits traités
        },
        raw: true
      })

      const totalWithdrawals = parseFloat(totalWithdrawalsResult[0]?.totalWithdrawals || 0)
      console.log(`💸 Total retraits traités: ${totalWithdrawals} FCFA`)

      // 3) Calculer le bénéfice net
      const netProfit = totalRecharges - totalWithdrawals
      console.log(`💰 Bénéfice net: ${netProfit} FCFA`)

      // 4) Statistiques supplémentaires
      const stats = {
        totalRecharges,
        totalWithdrawals,
        netProfit,
        profitMargin: totalRecharges > 0 ? ((netProfit / totalRecharges) * 100).toFixed(2) + '%' : '0%'
      }

      // 5) Statistiques mensuelles (simplifiées pour éviter l'erreur createdAt)
      stats.monthly = {
        note: 'Statistiques mensuelles disponibles prochainement'
      }

      res.json({
        message: 'Bénéfices calculés avec succès.',
        data: stats,
        explanation: {
          formula: 'Bénéfice = (Recharges revendeur→user) - (Retraits traités)',
          details: {
            recharges: 'Somme des transactions validées de revendeurs vers utilisateurs',
            withdrawals: 'Somme des retraits ayant le statut "traité"',
            netProfit: 'Recharges totales - Retraits traités'
          }
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors du calcul des bénéfices:', error)
      res.status(500).json({
        message: "Erreur lors du calcul des bénéfices.",
        error: error.message
      })
    }
  })
}