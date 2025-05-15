const moment = require('moment-timezone');
const { Game, Schedule } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/games/available/:pays', async (req, res) => {
    try {
      const { pays } = req.params;

      // Vérifier si le pays est valide
      const validPays = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'];
      if (!validPays.includes(pays)) {
        return res.status(400).json({ message: 'Pays invalide.' });
      }

      // Récupérer les horaires et les jeux associés pour le pays donné
      const schedules = await Schedule.findAll({
        where: { pays },
        include: [{ model: Game, as: 'game', where: { statut: 'ouvert' } }]
      });

      if (!schedules || schedules.length === 0) {
        return res.status(404).json({ message: `Aucun jeu disponible pour le pays : ${pays}.` });
      }

      // Vérifier la disponibilité des jeux
      const availableGames = schedules.map((schedule) => {
        const currentTime = moment().tz(schedule.timezone); // Heure actuelle dans le fuseau horaire du jeu
        const startTime = moment.tz(schedule.startTime, 'HH:mm:ss', schedule.timezone);
        const endTime = moment.tz(schedule.endTime, 'HH:mm:ss', schedule.timezone);

        const isAvailable = currentTime.isBetween(startTime, endTime);

        return isAvailable
          ? {
              nom: schedule.game.nom,
              description: schedule.game.description,
              pays: schedule.pays,
              timezone: schedule.timezone,
              statut: schedule.game.statut,
            }
          : null;
      });

      // Filtrer les jeux disponibles
      const filteredGames = availableGames.filter((game) => game !== null);

      res.status(200).json(filteredGames);
    } catch (error) {
      console.error('Erreur lors de la récupération des jeux disponibles :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};