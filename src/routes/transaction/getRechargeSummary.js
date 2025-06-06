const { ResellerToUserTransaction } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user/summary', async (req, res) => {
    try {
      const count = await ResellerToUserTransaction.count();
      const total = await ResellerToUserTransaction.sum('money');

      const nombreValide = await ResellerToUserTransaction.count({
        where: { status: 'validé' }
      });

      const nombreInvalidé = await ResellerToUserTransaction.count({
        where: { status: 'invalidé' }
      });

      res.json({
        message: "Résumé des transactions reseller-to-user.",
        nombreTransactions: count,
        sommeTotale: total || 0,
        nombreTransactionsValidees: nombreValide,
        // On remplace la clé accentuée par une version sans accent :
        nombreTransactionsInvalidatees: nombreInvalidé
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du résumé :", error);
      res.status(500).json({ message: "Erreur lors de la récupération du résumé.", error });
    }
  });
};