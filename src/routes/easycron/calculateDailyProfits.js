const { calculateDailyProfits } = require("../../scripts/calculateDailyProfits")

module.exports = (app) => {
  /**
   * GET /api/easycron/calculate-daily-profits
   *
   * Route appelée par cron-job.org pour calculer les bénéfices journaliers
   * Cette route exécute le script calculateDailyProfits.js
   */
  app.get('/api/easycron/calculate-daily-profits', async (req, res) => {
    try {
      // Date spécifique optionnelle : ?date=2026-04-07 — sinon calcule pour hier
      const targetDate = req.query.date ? new Date(req.query.date) : null;

      console.log(`🔄 [EASYCRON] Calcul des bénéfices pour : ${targetDate ? req.query.date : 'hier (défaut)'}`)

      const result = await calculateDailyProfits(targetDate)

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