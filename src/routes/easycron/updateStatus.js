const updateGameStatus = require('../../scripts/updateGamesStatus');

module.exports = (app) => {
  app.get('/api/update-status', async (req, res) => {
    try {
      await updateGameStatus(); // Appelle la logique de mise à jour des statuts
      res.status(200).send('Statuts des jeux mis à jour.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts :', error);
      res.status(500).send('Erreur lors de la mise à jour des statuts.');
    }
  });
};