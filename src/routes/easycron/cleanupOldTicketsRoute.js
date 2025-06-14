const scheduleCleanupOldTickets = require('../../scripts/cleanupOldTickets');

module.exports = (app) => {
  app.get('/api/cleanup-old-tickets', (req, res) => {
    try {
      scheduleCleanupOldTickets(); 
      res.status(200).send('Tâche de nettoyage des tickets >72h planifiée/exécutée.');
    } catch (error) {
      console.error('Erreur lors du déclenchement de la tâche de nettoyage des tickets :', error);
      res.status(500).send('Erreur lors du déclenchement de la tâche de nettoyage des tickets.');
    }
  });
};