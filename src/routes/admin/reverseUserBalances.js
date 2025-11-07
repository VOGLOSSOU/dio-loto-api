const { reverseUserBalances } = require('../../scripts/reverseUserBalances');

module.exports = (app) => {
  /**
   * GET /api/admin/reverse-balances
   * Route d'urgence pour ANNULER les corrections de soldes
   * TEMPORAIREMENT SANS AUTH pour tests - À SÉCURISER APRÈS !
   */
  app.get('/api/admin/reverse-balances', async (req, res) => {
    try {
      console.log('🚨 DEMANDE D\'ANNULATION DES CORRECTIONS DE SOLDES');
      console.log('⚠️ ROUTE TEMPORAIREMENT NON SÉCURISÉE - À CORRIGER APRÈS TESTS');

      console.log('🔄 Lancement de l\'annulation...');

      // Exécuter le script d'annulation
      const result = await reverseUserBalances();

      console.log('✅ Annulation terminée via API');

      res.json({
        message: 'Annulation des corrections de soldes terminée avec succès.',
        data: result,
        warning: 'Cette opération a REMIS LES SOLDES À LEUR ÉTAT PRÉCÉDENT.',
        security: '⚠️ Route temporairement sans authentification - À sécuriser !',
        recommendation: 'Vérifiez les soldes des utilisateurs pour confirmer l\'annulation.'
      });

    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation via API:', error);

      // Gestion spécifique des erreurs de connexion DB
      if (error.name === 'SequelizeConnectionError' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
          message: 'Service indisponible - Problème de connexion à la base de données.',
          error: 'Database connection timeout',
          suggestion: 'Vérifiez que MariaDB est démarré et accessible.'
        });
      }

      res.status(500).json({
        message: 'Erreur lors de l\'annulation des corrections.',
        error: error.message,
        details: 'Consultez les logs du serveur pour plus d\'informations.'
      });
    }
  });
};