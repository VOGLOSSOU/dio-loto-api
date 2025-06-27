const { Game, Result } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
// GET /api/games/:gameId/result
app.get('/api/games/:gameId/result', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findByPk(gameId, {
      include: [{ model: Result, as: 'result' }]
    });
    if (!game) {
      return res.status(404).json({ message: 'Jeu introuvable.' });
    }
    if (!game.result) {
      return res.status(404).json({ message: 'Aucun résultat pour ce jeu.' });
    }
    return res.status(200).json({ result: game.result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});
};