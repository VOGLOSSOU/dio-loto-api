const { ResellerToUserTransaction, Ticket, sequelize } = require("../../db/sequelize")
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

      // 2) Calculer la somme totale des gains des tickets attribués
      // Les gains sont stockés en JSON, on doit les sommer correctement
      const totalGainsResult = await Ticket.findAll({
        attributes: [
          [fn('SUM',
            literal(`CAST(JSON_EXTRACT(gains, '$[0]') AS DECIMAL(10,2))`)
          ), 'totalGains']
        ],
        where: {
          statut: 'attribué', // Uniquement les tickets avec gains attribués
          isCart: false
        },
        raw: true
      })

      const totalGains = parseFloat(totalGainsResult[0]?.totalGains || 0)
      console.log(`🎁 Total gains attribués: ${totalGains} FCFA`)

      // 3) Calculer le bénéfice net
      const netProfit = totalRecharges - totalGains
      console.log(`💰 Bénéfice net: ${netProfit} FCFA`)

      // 4) Statistiques supplémentaires
      const stats = {
        totalRecharges,
        totalGains,
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
          formula: 'Bénéfice = (Recharges revendeur→user) - (Gains des tickets attribués)',
          details: {
            recharges: 'Somme des transactions validées de revendeurs vers utilisateurs',
            gains: 'Somme des gains des tickets ayant le statut "attribué"',
            netProfit: 'Recharges totales - Gains totaux'
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