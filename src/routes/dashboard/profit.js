const { ResellerToUserTransaction, Ticket, Withdrawal, WithdrawalHistory, sequelize } = require("../../db/sequelize")
const { Op, fn, col, literal } = require('sequelize')
const auth = require("../../auth/auth");

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

      // 2) Calculer la somme totale des retraits traités (actifs + archivés)
      const activeWithdrawalsResult = await Withdrawal.findAll({
        attributes: [
          [fn('SUM', col('montant')), 'totalActive']
        ],
        where: {
          statut: 'traité' // Retraits actifs traités
        },
        raw: true
      })

      const archivedWithdrawalsResult = await WithdrawalHistory.findAll({
        attributes: [
          [fn('SUM', col('montant')), 'totalArchived']
        ],
        raw: true
      })

      const activeWithdrawals = parseFloat(activeWithdrawalsResult[0]?.totalActive || 0)
      const archivedWithdrawals = parseFloat(archivedWithdrawalsResult[0]?.totalArchived || 0)
      const totalWithdrawals = activeWithdrawals + archivedWithdrawals

      console.log(`💸 Retraits actifs traités: ${activeWithdrawals} FCFA`)
      console.log(`📦 Retraits archivés: ${archivedWithdrawals} FCFA`)
      console.log(`💸 Total retraits (actifs + archivés): ${totalWithdrawals} FCFA`)

      // 3) Calculer les salaires des revendeurs (10% des recharges)
      const totalSalaries = totalRecharges * 0.10
      console.log(`👥 Salaires revendeurs (10%): ${totalSalaries} FCFA`)

      // 4) Calculer le bénéfice net réel (après déduction des salaires)
      const netProfit = totalRecharges - totalWithdrawals - totalSalaries
      console.log(`💰 Bénéfice net réel: ${netProfit} FCFA`)

      // 5) Statistiques supplémentaires
      const stats = {
        totalRecharges,
        totalWithdrawals,
        totalSalaries,
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
          formula: 'Bénéfice = (Recharges revendeur→user) - (Retraits traités actifs + archivés) - (Salaires revendeurs 10%)',
          details: {
            recharges: 'Somme des transactions validées de revendeurs vers utilisateurs',
            withdrawals: 'Somme des retraits actifs (statut "traité") + retraits archivés (supprimés mais historisés)',
            salaries: '10% des recharges totales (salaires des revendeurs)',
            netProfit: 'Recharges totales - (Retraits actifs + archivés) - Salaires revendeurs'
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