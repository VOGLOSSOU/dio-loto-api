const { Withdrawal } = require('../../db/sequelize');

module.exports = (app) => {
  app.get('/api/withdrawals/summary', async (req, res) => {
    try {
      // 1. Total des retraits lancés
      const total = await Withdrawal.count();

      // 2. Total des retraits en cours de traitement
      const enCours = await Withdrawal.count({
        where: { statut: 'en cours de traitement' }
      });

      // 3. Total des retraits traités
      const traites = await Withdrawal.count({
        where: { statut: 'traité' }
      });

      res.status(200).json({
        message: 'Résumé des retraits.',
        totalRetraitsLances: total,
        totalRetraitsEnCours: enCours,
        totalRetraitsTraites: traites
      });
    } catch (error) {
      console.error('Erreur lors du résumé des retraits :', error);
      res.status(500).json({ message: 'Erreur serveur.', error });
    }
  });
};