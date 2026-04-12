const { Game, Schedule } = require('../../db/sequelize');

module.exports = (app) => {
  // Route pour consulter l'état de tous les jeux
  app.get('/api/games/status', async (req, res) => {
    try {
      const games = await Game.findAll({
        include: [{
          model: Schedule,
          as: 'schedules'
        }],
        order: [['pays', 'ASC'], ['nom', 'ASC']]
      });

      const gamesStatus = games.map(game => ({
        id: game.id,
        nom: game.nom,
        pays: game.pays,
        statut: game.statut,
        manualOverride: game.manualOverride,
        doubleChance: game.doubleChance,
        modeControle: game.manualOverride ? 'Manuel' : 'Automatique',
        description: game.description,
        schedules: game.schedules.map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone
        }))
      }));

      res.status(200).json({
        message: 'État des jeux récupéré avec succès.',
        totalGames: gamesStatus.length,
        gamesInManualMode: gamesStatus.filter(g => g.manualOverride).length,
        gamesInAutoMode: gamesStatus.filter(g => !g.manualOverride).length,
        games: gamesStatus
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état des jeux :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });

  // Route pour consulter l'état d'un jeu spécifique
  app.get('/api/games/:nom/status', async (req, res) => {
    try {
      const { nom } = req.params;

      const game = await Game.findOne({
        where: { nom },
        include: [{
          model: Schedule,
          as: 'schedules'
        }]
      });

      if (!game) {
        return res.status(404).json({ message: `Le jeu avec le nom "${nom}" n'existe pas.` });
      }

      const gameStatus = {
        id: game.id,
        nom: game.nom,
        pays: game.pays,
        statut: game.statut,
        manualOverride: game.manualOverride,
        doubleChance: game.doubleChance,
        modeControle: game.manualOverride ? 'Manuel' : 'Automatique',
        description: game.description,
        schedules: game.schedules.map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone
        }))
      };

      res.status(200).json({
        message: `État du jeu "${nom}" récupéré avec succès.`,
        game: gameStatus
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état du jeu :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};
