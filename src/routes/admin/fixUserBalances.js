const { fixUserBalances } = require('../../scripts/fixUserBalances');

module.exports = (app) => {
  /**
   * GET /api/admin/fix-balances
   * Route d'urgence pour corriger les soldes des utilisateurs
   * Exécute le script de correction des soldes
   */
  app.get('/api/admin/fix-balances', async (req, res) => {
    try {
      console.log('🚨 DEMANDE DE CORRECTION DES SOLDES UTILISATEURS');
      console.log('👤 Utilisateur:', req.user ? 'Authentifié' : 'Non authentifié');

      // Vérifier que c'est un admin (optionnel - à adapter selon tes besoins)
      // Ici on suppose que l'authentification suffit

      console.log('🔄 Lancement de la correction...');

      // Exécuter le script de correction
      const result = await fixUserBalances();

      console.log('✅ Correction terminée via API');

      res.json({
        message: 'Correction des soldes utilisateurs terminée avec succès.',
        data: result,
        warning: 'Cette opération a modifié les soldes de plusieurs utilisateurs.',
        recommendation: 'Vérifiez les logs pour confirmer les corrections.'
      });

    } catch (error) {
      console.error('❌ Erreur lors de la correction via API:', error);
      res.status(500).json({
        message: 'Erreur lors de la correction des soldes.',
        error: error.message,
        details: 'Consultez les logs du serveur pour plus d\'informations.'
      });
    }
  });
};