const { Reseller } = require('../../db/sequelize');
const { Op } = require('sequelize');
const reseller = require('../../models/reseller');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.get('/api/resellers', auth, (req, res) => {
    Reseller.findAll({ order: [['email', 'ASC']] })
      .then(resellers => {
        const message = 'La liste des Revendeurs a bien été récupérée.';
        res.json({ message, data: resellers });
      })
      .catch(error => {
        res.status(500).json({ message: "Une erreur est survenue.", error });
      });
  });
};