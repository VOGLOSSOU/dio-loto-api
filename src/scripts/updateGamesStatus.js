const cron = require('node-cron');
const moment = require('moment-timezone');
const { Game, Schedule } = require('../db/sequelize');

// Tâche planifiée pour mettre à jour le statut des jeux
const updateGameStatus = () => {
  cron.schedule('* * * * *', async () => { // Exécution chaque minute
    try {
      console.log('Mise à jour des statuts des jeux...');

      // Récupérer tous les horaires et leurs jeux associés
      const schedules = await Schedule.findAll({
        include: [{ model: Game, as: 'game' }]
      });

      const now = moment(); // Heure actuelle UTC

      for (const schedule of schedules) {
        const currentTime = now.tz(schedule.timezone); // Convertir l'heure actuelle dans le fuseau horaire du jeu
        const startTime = moment.tz(schedule.startTime, 'HH:mm:ss', schedule.timezone);
        const endTime = moment.tz(schedule.endTime, 'HH:mm:ss', schedule.timezone);

        // Vérifier si le jeu est dans son horaire
        const isInSchedule = currentTime.isBetween(startTime, endTime);

        // Mettre à jour le statut du jeu
        const game = schedule.game;
        if (isInSchedule && game.statut !== 'ouvert') {
          game.statut = 'ouvert';
          await game.save();
          console.log(`Le jeu "${game.nom}" est maintenant ouvert.`);
        } else if (!isInSchedule && game.statut !== 'fermé') {
          game.statut = 'fermé';
          await game.save();
          console.log(`Le jeu "${game.nom}" est maintenant fermé.`);
        }
      }

      console.log('Mise à jour des statuts terminée.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts des jeux :', error);
    }
  });
};

module.exports = updateGameStatus;