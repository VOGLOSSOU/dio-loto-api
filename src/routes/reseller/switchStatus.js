const { Reseller, User } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  /**
   * PATCH /api/resellers/:uniqueResellerId/status
   * Bascule le statut d'un revendeur entre "actif" et "bloqué".
   */
  app.patch('/api/resellers/:uniqueResellerId/status', auth, async (req, res) => {
    const { uniqueResellerId } = req.params;

    try {
      // 1) Recherche du revendeur avec jointure User
      const reseller = await Reseller.findOne({
        where: { uniqueResellerId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
      if (!reseller) {
        return res.status(404).json({ message: `Aucun revendeur trouvé pour l’identifiant : ${uniqueResellerId}` });
      }

      // 2) Inversion du statut
      reseller.status = reseller.status === 'actif' ? 'bloqué' : 'actif';

      // 3) Sauvegarde en base
      await reseller.save();

      // 4) Réponse
      return res.status(200).json({
        message: `Le statut du revendeur ${reseller.user ? reseller.user.lastName + ' ' + reseller.user.firstName : ''} a été mis à jour.`,
        data: {
          uniqueResellerId: reseller.uniqueResellerId,
          status: reseller.status,
          user: reseller.user
        }
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: error.message, data: error });
      }
      console.error("Erreur lors du basculement du statut du revendeur :", error);
      return res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};