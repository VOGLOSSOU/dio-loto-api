const { Transaction } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user/summary', async (req, res) => {
    try {
      const count = await Transaction.count({ where: { type: 'reseller-to-user' } });
      const total = await Transaction.sum('money', { where: { type: 'reseller-to-user' } });

      res.json({
        message: "Résumé des recharges reseller-to-user.",
        nombreTransactions: count,
        sommeTotale: total || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du résumé.", error });
    }
  });
};