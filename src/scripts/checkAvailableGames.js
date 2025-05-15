const moment = require('moment-timezone');
const { Game, Schedule } = require('../db/sequelize');

// Route pour récupérer les jeux disponibles pour un pays donné
module.exports = (app) => {
  app.get('/api/games/:pays', async (req, res) => {
    try {
      const { pays } = req.params;

      // Vérifier si le pays est valide
      const validPays = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'];
      if (!validPays.includes(pays)) {
        return res.status(400).json({ message: 'Pays invalide.' });
      }

      // Récupérer les jeux et leurs horaires pour le pays donné
      const schedules = await Schedule.findAll({
        where: { pays },
        include: [{ model: Game, as: 'game' }] // Assurez-vous que la relation est bien définie
      });

      if (!schedules || schedules.length === 0) {
        return res.status(404).json({ message: `Aucun horaire trouvé pour le pays : ${pays}.` });
      }

      // Vérifier la disponibilité des jeux
      const availableGames = schedules.map((schedule) => {
        // Convertir l'heure actuelle dans le fuseau horaire du jeu
        const currentTime = moment().tz(schedule.timezone); // Heure actuelle dans le fuseau horaire du jeu
        const startTime = moment.tz(schedule.startTime, 'HH:mm:ss', schedule.timezone);
        const endTime = moment.tz(schedule.endTime, 'HH:mm:ss', schedule.timezone);

        // Vérifier si le jeu est disponible
        const isAvailable = currentTime.isBetween(startTime, endTime);

        // Vérifier si le jeu est ouvert
        const isOpen = schedule.game.statut === 'ouvert';

        return {
          nom: schedule.game.nom,
          description: schedule.game.description,
          pays: schedule.pays,
          timezone: schedule.timezone,
          isVisible: isAvailable && isOpen, // Le jeu est visible uniquement s'il est disponible et ouvert
          debug: {
            currentTime: currentTime.format('HH:mm:ss'), // Pour débogage
            startTime: startTime.format('HH:mm:ss'),
            endTime: endTime.format('HH:mm:ss'),
            statut: schedule.game.statut, // Statut du jeu pour débogage
          },
        };
      });

      // Retourner la liste des jeux avec leur visibilité
      res.status(200).json(availableGames);
    } catch (error) {
      console.error('Erreur lors de la récupération des jeux :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};