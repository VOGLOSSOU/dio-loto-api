const { Reseller } = require('../../db/sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.delete('/api/resellers/:id', auth, (req, res) => {
    Reseller.findByPk(req.params.id)
      .then(reseller => {
        if (!reseller) {
          return res.status(404).json({ message: `Aucun revendeur trouvé avec l'ID ${req.params.id}.` });
        }
        return Reseller.destroy({ where: { id: reseller.id } })
          .then(() => {
            res.json({ message: `Le Revendeur avec l'ID ${reseller.id} a bien été supprimé.`, data: reseller });
          });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};