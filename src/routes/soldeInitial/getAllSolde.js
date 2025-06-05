const { SoldeInitial, Transaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/solde-systeme', auth, async (req, res) => {
    try {
      // 1. Total injecté
      const montantInjecte = await SoldeInitial.sum('montant');

      // 2. Total dépensé (toutes les recharges admin-to-reseller validées)
      const montantDepense = await Transaction.sum('money', {
        where: { type: 'admin-to-reseller', status: 'validé' }
      });

      // 3. Solde disponible
      const montantDisponible = (montantInjecte || 0) - (montantDepense || 0);

      res.json({
        message: 'Solde du système',
        data: {
          montantInjecte: montantInjecte || 0,
          montantDepense: montantDepense || 0,
          montantDisponible
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du calcul du solde système.", error });
    }
  });
};