const { Game, Result } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  // POST /api/games/:gameId/result : enregistre un résultat pour le jeu
  app.post('/api/games/:gameId/result', auth, async (req, res) => {
    try {
      const { gameId } = req.params;
      // Accepte numbers, numbers1 et numbers2
      const { numbers, numbers1, numbers2 } = req.body;

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

      // 4) Déterminer le champ principal à utiliser
      // Pour double chance, le frontend envoie numbers1 et numbers2
      // Pour simple, il envoie numbers
      const mainNumbers = numbers || numbers1;

      // 5) Valider la chaîne de numéros
      if (!mainNumbers || typeof mainNumbers !== 'string' || mainNumbers.trim().length === 0) {
        return res.status(400).json({ message: 'Les numéros gagnants sont requis.' });
      }
      // Optionnel : valider numbers2 si fourni
      if (numbers2 && typeof numbers2 !== 'string') {
        return res.status(400).json({ message: 'Le second résultat doit être une chaîne.' });
      }

      // 6) Créer l’enregistrement dans Result
      const newResult = await Result.create({
        gameId: game.id,
        numbers: mainNumbers.trim(),
        numbers2: numbers2 ? numbers2.trim() : null
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