const { Admin } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.put('/api/admins/:id',auth, (req, res) => {
    const id = req.params.id;
    Admin.update(req.body, { where: { id } })
      .then(() => Admin.findByPk(id))
      .then(admin => {
        if (!admin) {
          return res.status(404).json({ message: `Aucun administrateur trouvé avec l'ID ${id}.` });
        }
        res.json({ message: `L'administrateur ${admin.email} a bien été mis à jour.`, data: admin });
      })
      .catch(error => {
        if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
          return res.status(400).json({ message: error.message, data: error });
        }
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};