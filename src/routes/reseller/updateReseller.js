const { Reseller, User } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  app.put('/api/resellers/:id', auth, async (req, res) => {
    const id = req.params.id;
    try {
      // On ne met à jour que les champs propres au revendeur
      const allowedFields = ['soldeRevendeur', 'whatsapp', 'pays', 'status'];
      const updateData = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      }

      const [updatedRows] = await Reseller.update(updateData, { where: { id } });
      if (!updatedRows) {
        return res.status(404).json({ message: `Aucun Revendeur trouvé avec l'ID ${id}.` });
      }

      // On retourne le revendeur avec les infos user associées
      const reseller = await Reseller.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'solde', 'gain']
        }]
      });

      res.json({
        message: `Le Revendeur a bien été mis à jour.`,
        data: reseller
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: error.message, data: error });
      }
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};