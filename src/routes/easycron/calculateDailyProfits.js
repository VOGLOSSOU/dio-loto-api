const { calculateDailyProfits } = require("../../scripts/calculateDailyProfits")

module.exports = (app) => {
  /**
   * POST /api/easycron/calculate-daily-profits
   *
   * Route appelée par cron-job.org pour calculer les bénéfices journaliers
   * Cette route exécute le script calculateDailyProfits.js
   */
  app.post('/api/easycron/calculate-daily-profits', async (req, res) => {
    try {
      console.log('🔄 [EASYCRON] Début du calcul automatique des bénéfices journaliers...')

      // Exécuter le calcul des bénéfices de la veille
      const result = await calculateDailyProfits()

      console.log('✅ [EASYCRON] Calcul terminé avec succès:', result)

      res.status(200).json({
        message: 'Calcul des bénéfices journaliers terminé avec succès.',
        data: result,
        timestamp: new Date().toISOString(),
        source: 'easycron'
      })

    } catch (error) {
      console.error('❌ [EASYCRON] Erreur lors du calcul des bénéfices journaliers:', error)

      res.status(500).json({
        message: "Erreur lors du calcul automatique des bénéfices journaliers.",
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'easycron'
      })
    }
  })
}