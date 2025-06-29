const cron = require('node-cron');
const moment = require('moment-timezone');
const { Game, Schedule, Result } = require('../db/sequelize'); 

// Tâche planifiée pour mettre à jour le statut des jeux
const updateGameStatus = () => {
  cron.schedule('* * * * *', async () => { // Exécution chaque minute
    try {
      console.log(`[${new Date().toISOString()}] Mise à jour des statuts des jeux...`);

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
        const isInSchedule = startTime.isBefore(endTime)
          ? currentTime.isBetween(startTime, endTime) // Cas normal : startTime < endTime
          : currentTime.isAfter(startTime) || currentTime.isBefore(endTime); // Cas où la plage traverse minuit

        // Mettre à jour le statut du jeu
        const game = schedule.game;
        if (isInSchedule && game.statut !== 'ouvert') {
          game.statut = 'ouvert';
          await game.save();
          console.log(`Le jeu "${game.nom}" est maintenant ouvert.`);

          // Nouvelle fonctionnalité : suppression du résultat si le jeu s'ouvre
          const deleted = await Result.destroy({ where: { gameId: game.id } });
          if (deleted > 0) {
            console.log(`Résultat supprimé pour le jeu "${game.nom}" (id=${game.id})`);
          }
        } else if (!isInSchedule && game.statut !== 'fermé') {
          game.statut = 'fermé';
          await game.save();
          console.log(`Le jeu "${game.nom}" est maintenant fermé.`);
        }

        // Logs détaillés pour chaque jeu (désactivés)
        // console.log(`Vérification du jeu : ${schedule.game.nom}`);
        // console.log(`Heure actuelle : ${currentTime.format('HH:mm:ss')} (${schedule.timezone})`);
        // console.log(`Plage horaire : ${startTime.format('HH:mm:ss')} - ${endTime.format('HH:mm:ss')}`);
        // console.log(`Statut actuel : ${schedule.game.statut}`);
        // console.log(`Fuseau horaire pour le jeu "${schedule.game.nom}" : ${schedule.timezone}`);
        // console.log(`Est dans la plage horaire : ${isInSchedule}`);
      }

      console.log('Mise à jour des statuts terminée.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts des jeux :', error.message);
      console.error(error.stack);
    }
  });
};

module.exports = updateGameStatus;