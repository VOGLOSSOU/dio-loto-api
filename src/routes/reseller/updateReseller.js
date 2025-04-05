const { Reseller } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.put('/api/resellers/:id', auth, (req, res) => {
    const id = req.params.id;
    Reseller.update(req.body, { where: { id } })
      .then(() => Reseller.findByPk(id))
      .then(reseller => {
        if (!reseller) {
          return res.status(404).json({ message: `Aucun Revendeur trouvé avec l'ID ${id}.` });
        }
        res.json({ message: `Le Revendeur ${reseller.email} a bien été mis à jour.`, data: reseller });
      })
      .catch(error => {
        if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
          return res.status(400).json({ message: error.message, data: error });
        }
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};