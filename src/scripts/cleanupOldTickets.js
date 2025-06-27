// src/scripts/cleanupOldTickets.js

const cron = require('node-cron');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Ticket } = require('../db/sequelize'); // adapte le chemin selon ton projet

/**
 * Planifie une tâche cron qui s'exécute chaque heure (à la minute 0) 
 * pour supprimer les tickets dont la date de création est >72h.
 */
const scheduleCleanupOldTickets = () => {
  // Expression cron '0 * * * *' = à la minute 0 de chaque heure
  cron.schedule('0 * * * *', async () => {
    const timestamp = moment().toISOString();
    console.log(`[${timestamp}] Début de la suppression des tickets créés il y a plus de 72h...`);

    try {
      // Calcul du cutoff : maintenant - 72 heures
      // On utilise moment pour clarté, mais toDate() est un Date JS.
      const cutoffMoment = moment().subtract(72, 'hours');
      const cutoffDate = cutoffMoment.toDate();

      console.log(`  → Date limite (cutoff) : ${cutoffMoment.format('YYYY-MM-DD HH:mm:ss')} (tickets < cette date seront supprimés)`);

      // Suppression bulk
      const nbDeleted = await Ticket.destroy({
        where: {
          // champ 'created' défini dans ton modèle via timestamps: true, createdAt: 'created'
          created: { [Op.lt]: cutoffDate }
        }
      });

      console.log(`  → Nombre de tickets supprimés : ${nbDeleted}`);

      console.log(`[${moment().toISOString()}] Suppression terminée.`);
    } catch (error) {
      console.error(`[${moment().toISOString()}] Erreur lors de la suppression des anciens tickets :`, error.message);
      console.error(error.stack);
    }
  });

  console.log('Planification de la tâche cron pour nettoyage des tickets >72h : cron.schedule("0 * * * *", ...)');
};

module.exports = scheduleCleanupOldTickets;