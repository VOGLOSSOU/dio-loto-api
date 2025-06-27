const { Reseller } = require('../../db/sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  app.delete('/api/resellers/:uniqueResellerId', auth, async (req, res) => {
    try {
      const reseller = await Reseller.findOne({ where: { id: req.params.uniqueResellerId } });
      if (!reseller) {
        return res.status(404).json({ message: `Aucun revendeur trouvé avec l'identifiant ${req.params.uniqueResellerId}.` });
      }
      await reseller.destroy();
      res.json({ message: `Le revendeur avec l'identifiant ${req.params.uniqueResellerId} a bien été supprimé.`, data: reseller });
    } catch (error) {
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};