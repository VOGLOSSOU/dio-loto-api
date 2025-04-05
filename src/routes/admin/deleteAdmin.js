const { Admin } = require('../../db/sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.delete('/api/admins/:id',auth, (req, res) => {
    Admin.findByPk(req.params.id)
      .then(admin => {
        if (!admin) {
          return res.status(404).json({ message: `Aucun administrateur trouvé avec l'ID ${req.params.id}.` });
        }
        return Admin.destroy({ where: { id: admin.id } })
          .then(() => {
            res.json({ message: `L'administrateur avec l'ID ${admin.id} a bien été supprimé.`, data: admin });
          });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};