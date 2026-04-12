const { Game, Schedule } = require('../../db/sequelize');

const validPays = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'France', 'Togo'];

module.exports = (app) => {
  app.get('/api/games/available/:pays', async (req, res) => {
    try {
      const { pays } = req.params;

      // Vérifier si le pays est valide
      if (!validPays.includes(pays)) {
        return res.status(400).json({ message: 'Pays invalide.' });
      }

      // Récupérer tous les jeux ouverts pour le pays donné, triés par heure d'ouverture
      const games = await Game.findAll({
        where: { pays, statut: 'ouvert' },
        include: [{
          model: Schedule,
          as: 'schedules',
          attributes: ['startTime']
        }],
        attributes: ['nom', 'description', 'pays', 'statut'],
        order: [
          [Schedule, 'startTime', 'ASC']
        ]
      });

      // Toujours renvoyer une réponse 200 avec ou sans jeux
      return res.status(200).json({
        message: games.length > 0
          ? 'Jeux disponibles.'
          : `Aucun jeu disponible pour le pays : ${pays}.`,
        games
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des jeux disponibles :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};