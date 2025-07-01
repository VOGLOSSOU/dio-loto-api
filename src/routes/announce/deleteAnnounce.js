const { Annonce } = require('../../db/sequelize');

module.exports = (app) => {
  app.delete('/api/annonces/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const annonce = await Annonce.findByPk(id);
      if (!annonce) {
        return res.status(404).json({ message: "Annonce non trouvée." });
      }
      await annonce.destroy();
      res.status(200).json({ message: "Annonce supprimée avec succès." });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'annonce.", error: error.message });
    }
  });
};