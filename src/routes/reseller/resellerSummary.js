// routes/resellerSummary.js
const { ResellerToUserTransaction, Reseller, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const { validate: uuidValidate, version: uuidVersion } = require('uuid');

module.exports = (app) => {
  /**
   * GET /api/transactions/reseller-to-user/summary/:uniqueResellerId
   * Retourne :
   *  - totalSum : somme totale des recharges validées pour ce revendeur
   *  - last24hSum : somme des recharges validées des dernières 24h
   *  - last24hTransactions : tableau des transactions validées des dernières 24h, avec infos associées
   */
  app.get('/api/transactions/reseller-to-user/summary/:uniqueResellerId', async (req, res) => {
    const { uniqueResellerId } = req.params;

    // Validation manuelle UUID v4
    if (!uuidValidate(uniqueResellerId) || uuidVersion(uniqueResellerId) !== 4) {
      return res.status(400).json({
        errors: ["Le paramètre 'uniqueResellerId' doit être un UUID v4 valide."]
      });
    }

    try {
      // Vérifier l'existence du revendeur
      const reseller = await Reseller.findOne({ where: { uniqueResellerId } });
      if (!reseller) {
        return res.status(404).json({
          message: `Aucun revendeur trouvé avec uniqueResellerId=${uniqueResellerId}.`
        });
      }

      // Filtrer uniquement les transactions validées pour ce revendeur
      const baseWhere = {
        sender: uniqueResellerId,
        status: 'validé'
      };

      // 1. Somme totale
      const totalSumRaw = await ResellerToUserTransaction.sum('money', {
        where: baseWhere
      });
      const totalSum = totalSumRaw || 0;

      // Calcul du timestamp "24 heures en arrière"
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 2. Somme des 24 dernières heures
      const last24Where = {
        ...baseWhere,
        created: { [Op.gte]: since }
      };
      const last24SumRaw = await ResellerToUserTransaction.sum('money', {
        where: last24Where
      });
      const last24Sum = last24SumRaw || 0;

      // 3. Liste des transactions des dernières 24 heures, avec include
      const last24hTransactions = await ResellerToUserTransaction.findAll({
        where: last24Where,
        order: [['created', 'DESC']],
        include: [
          {
            model: Reseller,
            as: 'reseller',
            attributes: ['uniqueResellerId', 'soldeRevendeur', 'status'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      });

      return res.json({
        message: `Résumé des recharges pour le revendeur ${uniqueResellerId}`,
        data: {
          totalSum,
          last24hSum: last24Sum,
          last24hTransactions  // correspond bien à la variable ci-dessus
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erreur lors du calcul du résumé des recharges.",
        error: error.message || error
      });
    }
  });
};