const { Game } = require('../../db/sequelize');

module.exports = (app) => {
  app.put('/api/games/:nom/statut', async (req, res) => {
    try {
      const { nom } = req.params;
      const { statut } = req.body; // Le nouveau statut à appliquer

      // Vérifier si le statut est valide
      if (!['ouvert', 'fermé'].includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide. Les valeurs acceptées sont "ouvert" ou "fermé".' });
      }

      // Trouver le jeu par son nom
      const game = await Game.findOne({ where: { nom } });

      if (!game) {
        return res.status(404).json({ message: `Le jeu avec le nom "${nom}" n'existe pas.` });
      }

      // Mettre à jour le statut du jeu ET activer le flag manualOverride
      game.statut = statut;
      game.manualOverride = true; // Indique qu'un admin a pris le contrôle manuel
      await game.save();

      res.status(200).json({
        message: `Le statut du jeu "${nom}" a été mis à jour en "${statut}" (contrôle manuel activé).`,
        game
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du jeu :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};