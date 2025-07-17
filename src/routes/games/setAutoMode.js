const { Game } = require('../../db/sequelize');

module.exports = (app) => {
  // Route pour désactiver le contrôle manuel et remettre en mode automatique
  app.patch('/api/games/:nom/auto-mode', async (req, res) => {
    try {
      const { nom } = req.params;

      // Trouver le jeu par son nom
      const game = await Game.findOne({ where: { nom } });

      if (!game) {
        return res.status(404).json({ message: `Le jeu avec le nom "${nom}" n'existe pas.` });
      }

      // Désactiver le contrôle manuel
      game.manualOverride = false;
      await game.save();

      res.status(200).json({ 
        message: `Le jeu "${nom}" est maintenant en mode automatique. Le statut sera géré selon les horaires programmés.`, 
        game: {
          nom: game.nom,
          statut: game.statut,
          manualOverride: game.manualOverride,
          modeControle: 'Automatique'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la remise en mode automatique :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};