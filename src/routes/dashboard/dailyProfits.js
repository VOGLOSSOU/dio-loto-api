const { DailyProfit } = require("../../db/sequelize")
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/dashboard/daily-profits', auth, async (req, res) => {
    try {
      console.log('📊 Récupération des bénéfices journaliers...')

      // Récupérer les 30 derniers jours de bénéfices
      const dailyProfits = await DailyProfit.findAll({
        order: [['date', 'DESC']], // Du plus récent au plus ancien
        limit: 30,
        attributes: ['date', 'totalRecharges', 'totalWithdrawals', 'netProfit']
      })

      // Transformer les données pour le frontend
      const formattedData = dailyProfits.map(profit => ({
        date: profit.date,
        totalRecharges: parseFloat(profit.totalRecharges),
        totalWithdrawals: parseFloat(profit.totalWithdrawals),
        netProfit: parseFloat(profit.netProfit)
      }))

      res.json({
        message: 'Bénéfices journaliers récupérés avec succès.',
        data: formattedData,
        count: formattedData.length,
        explanation: {
          period: '30 derniers jours',
          calculation: 'Bénéfice journalier = Recharges du jour - Retraits du jour'
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des bénéfices journaliers:', error)
      res.status(500).json({
        message: "Erreur lors de la récupération des bénéfices journaliers.",
        error: error.message
      })
    }
  })
}