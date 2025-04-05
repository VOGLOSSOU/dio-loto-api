const { Reseller } = require('../../db/sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/resellers/:id',auth, (req, res) => {
    Reseller.findByPk(req.params.id)
      .then(reseller => {
        if (!reseller) {
          return res.status(404).json({ message: `Aucun revendeur trouvé avec l'ID ${req.params.id}.` });
        }
        const message = 'Un Revendeur a bien été trouvé.';
        res.json({ message, data: reseller });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};