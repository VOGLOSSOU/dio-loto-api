const { Reseller, User } = require('../../db/sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  app.get('/api/resellers/:id', auth, async (req, res) => {
    try {
      const reseller = await Reseller.findByPk(req.params.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'solde', 'gain']
        }]
      });
      if (!reseller) {
        return res.status(404).json({ message: `Aucun revendeur trouvé avec l'ID ${req.params.id}.` });
      }
      res.json({
        message: 'Un revendeur a bien été trouvé.',
        data: reseller
      });
    } catch (error) {
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};