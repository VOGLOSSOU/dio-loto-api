const { Announce } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/annonces', async (req, res) => {
    try {
      const { titre, description } = req.body;
      if (!titre || !description) {
        return res.status(400).json({ message: "Titre et description requis." });
      }
      const annonce = await Announce.create({ titre, description });
      res.status(201).json({ message: "Annonce créée avec succès.", annonce });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'annonce.", error: error.message });
    }
  });
};