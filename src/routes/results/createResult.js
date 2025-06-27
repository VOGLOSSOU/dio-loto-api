// routes/results.js
const { Game, Result } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  // POST /api/games/:gameId/result : enregistre un résultat pour le jeu
  app.post('/api/games/:gameId/result', auth, async (req, res) => {
    try {
      const { gameId } = req.params;
      const { numbers } = req.body;

      // 1) Vérifier que le jeu existe
      const game = await Game.findByPk(gameId, {
        include: [{ model: Result, as: 'result' }]
      });
      if (!game) {
        return res.status(404).json({ message: 'Jeu introuvable.' });
      }

      // 2) Vérifier que le jeu est fermé
      if (game.statut !== 'fermé') {
        return res.status(400).json({ message: 'Le jeu n’est pas fermé.' });
      }

      // 3) Vérifier qu’il n’y a pas déjà de résultat
      if (game.result) {
        return res.status(400).json({ message: 'Le résultat a déjà été saisi pour ce jeu.' });
      }

      // 4) Valider la chaîne de numéros
      if (!numbers || typeof numbers !== 'string' || numbers.trim().length === 0) {
        return res.status(400).json({ message: 'Les numéros gagnants sont requis.' });
      }

      // 5) Créer l’enregistrement dans Result
      const newResult = await Result.create({
        gameId: game.id,
        numbers: numbers.trim()
      });

      return res.status(201).json({
        message: 'Résultat enregistré avec succès.',
        result: newResult
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
  });
};