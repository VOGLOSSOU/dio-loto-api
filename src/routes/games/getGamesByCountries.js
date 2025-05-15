const { Game } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/games/all/:pays', async (req, res) => {
    try {
      const { pays } = req.params;

      // Vérifier si le pays est valide
      const validPays = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'];
      if (!validPays.includes(pays)) {
        return res.status(400).json({ message: 'Pays invalide.' });
      }

      // Récupérer tous les jeux du pays
      const games = await Game.findAll({ where: { pays } });

      if (!games || games.length === 0) {
        return res.status(404).json({ message: `Aucun jeu trouvé pour le pays : ${pays}.` });
      }

      res.status(200).json(games);
    } catch (error) {
      console.error('Erreur lors de la récupération des jeux :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};