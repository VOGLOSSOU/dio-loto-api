const { Admin } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/admins', auth, (req, res) => {
    Admin.findAll({ order: [['email', 'ASC']] })
      .then(admins => {
        const message = 'La liste des administrateurs a bien été récupérée.';
        res.json({ message, data: admins });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};