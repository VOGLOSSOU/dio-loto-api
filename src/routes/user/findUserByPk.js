const { User } = require('../../db/sequelize')
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/users/:id',auth, (req, res) => {
    User.findByPk(req.params.id)
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: `Aucun utilisateur trouvé avec l'ID ${req.params.id}.` });
        }

        const message = 'Un user a bien été trouvé.';
        res.json({ message, data: user });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
}