const { Admin } = require('../../db/sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/admins/:id', auth, (req, res) => {
    Admin.findByPk(req.params.id)
      .then(admin => {
        if (!admin) {
          return res.status(404).json({ message: `Aucun administrateur trouvé avec l'ID ${req.params.id}.` });
        }
        const message = 'Un administrateur a bien été trouvé.';
        res.json({ message, data: admin });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};