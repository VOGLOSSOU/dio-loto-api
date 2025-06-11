const { SoldeInitial, Transaction, AdminToUserTransaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/solde-systeme', auth, async (req, res) => {
    try {
      // 1. Total injecté
      const montantInjecte = await SoldeInitial.sum('montant');

      // 2. Dépenses vers les revendeurs
      const montantDepenseReseller = await Transaction.sum('money', {
        where: { type: 'admin-to-reseller', status: 'validé' }
      });

      // 3. Dépenses vers les utilisateurs
      const montantDepenseUser = await AdminToUserTransaction.sum('money', {
        where: { status: 'validé' }
      });

      // 4. Montant total dépensé
      const montantDepense = (montantDepenseReseller || 0) + (montantDepenseUser || 0);

      // 5. Solde disponible
      const montantDisponible = (montantInjecte || 0) - montantDepense;

      res.json({
        message: 'Solde du système mis à jour',
        data: {
          montantInjecte: montantInjecte || 0,
          montantDepense,
          montantDisponible
        }
      });

    } catch (error) {
  console.error("Erreur dans /api/solde-systeme :", error);
  res.status(500).json({
    message: "Erreur lors du calcul du solde système.",
    error: error.message
  });
}
  });
};