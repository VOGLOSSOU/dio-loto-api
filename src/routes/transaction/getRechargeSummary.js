const { ResellerToUserTransaction } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user/summary', async (req, res) => {
    try {
      const count = await ResellerToUserTransaction.count();
      const total = await ResellerToUserTransaction.sum('money');

      res.json({
        message: "Résumé des transactions reseller-to-user.",
        nombreTransactions: count,
        sommeTotale: total || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du résumé.", error });
    }
  });
};