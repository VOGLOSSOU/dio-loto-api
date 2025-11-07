const { fixUserBalances } = require('../../scripts/fixUserBalances');

module.exports = (app) => {
  /**
   * GET /api/admin/fix-balances
   * Route d'urgence pour corriger les soldes des utilisateurs
   * TEMPORAIREMENT SANS AUTH pour tests - À SÉCURISER APRÈS !
   */
  app.get('/api/admin/fix-balances', async (req, res) => {
    try {
      console.log('🚨 DEMANDE DE CORRECTION DES SOLDES UTILISATEURS');
      console.log('⚠️ ROUTE TEMPORAIREMENT NON SÉCURISÉE - À CORRIGER APRÈS TESTS');

      console.log('🔄 Lancement de la correction...');

      // Exécuter le script de correction
      const result = await fixUserBalances();

      console.log('✅ Correction terminée via API');

      res.json({
        message: 'Correction des soldes utilisateurs terminée avec succès.',
        data: result,
        warning: 'Cette opération a modifié les soldes de plusieurs utilisateurs.',
        security: '⚠️ Route temporairement sans authentification - À sécuriser !',
        recommendation: 'Vérifiez les logs pour confirmer les corrections.'
      });

    } catch (error) {
      console.error('❌ Erreur lors de la correction via API:', error);

      // Gestion spécifique des erreurs de connexion DB
      if (error.name === 'SequelizeConnectionError' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
          message: 'Service indisponible - Problème de connexion à la base de données.',
          error: 'Database connection timeout',
          suggestion: 'Vérifiez que MariaDB est démarré et accessible.'
        });
      }

      res.status(500).json({
        message: 'Erreur lors de la correction des soldes.',
        error: error.message,
        details: 'Consultez les logs du serveur pour plus d\'informations.'
      });
    }
  });
};