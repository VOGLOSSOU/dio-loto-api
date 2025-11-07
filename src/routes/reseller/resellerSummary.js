// routes/resellerSummary.js
const { ResellerToUserTransaction, Reseller, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const { validate: uuidValidate, version: uuidVersion } = require('uuid');
const moment = require('moment-timezone');

module.exports = (app) => {
  /**
   * GET /api/transactions/reseller-to-user/summary/:uniqueResellerId
   * Retourne :
   *  - totalSum : somme totale des recharges validées pour ce revendeur
   *  - todaySum : somme des recharges validées de la journée en cours (depuis minuit)
   *  - todayTransactions : tableau des transactions validées de la journée en cours, avec infos associées
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

      // Calcul du timestamp "depuis minuit aujourd'hui" selon l'heure du Bénin (Africa/Porto-Novo)
      const today = moment().tz('Africa/Porto-Novo');
      today.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const since = today.toDate();

      // 2. Somme de la journée en cours
      const todayWhere = {
        ...baseWhere,
        created: { [Op.gte]: since }
      };
      const todaySumRaw = await ResellerToUserTransaction.sum('money', {
        where: todayWhere
      });
      const todaySum = todaySumRaw || 0;

      // 3. Liste des transactions de la journée en cours, avec include
      const todayTransactions = await ResellerToUserTransaction.findAll({
        where: todayWhere,
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
          todaySum: todaySum,
          todayTransactions  // correspond bien à la variable ci-dessus
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