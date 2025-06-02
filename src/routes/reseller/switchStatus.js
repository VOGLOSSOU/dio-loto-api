const { Reseller, User } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  /**
   * PATCH /api/resellers/:uniqueResellerId/status
   * 
   * Bascule le statut d'un revendeur entre "actif" et "bloqué".
   * - On récupère l'uniqueResellerId dans les params.
   * - Si le revendeur n'existe pas : 404.
   * - Sinon, on inverse reseller.status puis on sauvegarde.
   * - Retourne 200 + message + données du revendeur mis à jour.
   */
  app.patch('/api/resellers/:uniqueResellerId/status', auth, async (req, res) => {
    const { uniqueResellerId } = req.params;

    try {
      // 1) Recherche du revendeur par son UUID
      const reseller = await Reseller.findOne({ where: { uniqueResellerId } });
      if (!reseller) {
        return res.status(404).json({ message: `Aucun revendeur trouvé pour l’identifiant : ${uniqueResellerId}` });
      }

      // 2) Inversion du statut
      if (reseller.status === 'actif') {
        reseller.status = 'bloqué';
      } else {
        reseller.status = 'actif';
      }

      // 3) Sauvegarde en base
      await reseller.save();

      // 4) Réponse
      return res.status(200).json({
        message: `Le statut du revendeur ${reseller.lastName} ${reseller.firstName} a été mis à jour.`,
        data: {
          uniqueResellerId: reseller.uniqueResellerId,
          status: reseller.status
        }
      });
    } catch (error) {
      // Si jamais une erreur de validation ou contrainte Sequelize survenait (ici improbable, car on reste dans les valeurs autorisées de l'ENUM),
      // on les gère pour renvoyer un 400. Sinon, on renvoie 500.
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: error.message, data: error });
      }
      console.error("Erreur lors du basculement du statut du revendeur :", error);
      return res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};