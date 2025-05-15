module.exports = (app) => {
  app.get('/api/ping', (req, res) => {
    res.status(200).send('Pong! Le serveur est actif.');
  });
};