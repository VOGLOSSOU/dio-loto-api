const { resetAllBonuses } = require('../../scripts/resetBonuses');

module.exports = (app) => {
  /**
   * GET /api/admin/reset-bonuses
   * Route pour remettre tous les bonus à 0
   * À utiliser avec cron-job.org à 23h59 (heure Bénin) le 10 novembre 2025
   */
  app.get('/api/admin/reset-bonuses', async (req, res) => {
    try {
      console.log('🔄 Appel de remise à zéro des bonus via API');

      const result = await resetAllBonuses();

      res.status(200).json({
        message: 'Remise à zéro des bonus exécutée',
        result
      });

    } catch (error) {
      console.error('❌ Erreur lors de la remise à zéro des bonus via API:', error);
      res.status(500).json({
        message: 'Erreur lors de la remise à zéro des bonus',
        error: error.message
      });
    }
  });
};