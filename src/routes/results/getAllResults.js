// routes/results.js

const { Result, Game } = require('../../db/sequelize'); // ajustez selon votre architecture
const auth = require('../../auth/auth');                  // si vous souhaitez protéger la route

module.exports = (app) => {
  // GET /api/results
  app.get('/api/results', /* auth, */ async (req, res) => {
    try {
      // Récupère tous les enregistrements de la table Results,
      // en incluant l'entité Game associée si besoin :
      const results = await Result.findAll({
        include: [{ model: Game, as: 'game' }]
      });

      return res.status(200).json({ results });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
  });
};