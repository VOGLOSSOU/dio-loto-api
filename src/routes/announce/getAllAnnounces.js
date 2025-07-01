const { Annonce } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/annonces', async (req, res) => {
    try {
      const annonces = await Annonce.findAll({
        order: [['created', 'DESC']] // les plus récentes en premier
      });

      res.status(200).json(annonces);
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la récupération des annonces.",
        error: error.message
      });
    }
  });
};