// routes/getWithdrawalsByUser.js

const { Withdrawal, User } = require('../../db/sequelize');

module.exports = (app) => {
  /**
   * GET /api/withdrawals/user/:uniqueUserId
   * Récupère tous les retraits associés à un utilisateur donné (via uniqueUserId).
   * Exemple d’URL :
   *   /api/withdrawals/user/123e4567-e89b-12d3-a456-426614174000
   */
  app.get('/api/withdrawals/user/:uniqueUserId', async (req, res) => {
    const { uniqueUserId } = req.params;

    try {
      // Vérifier qu’un utilisateur existe (facultatif mais recommandé)
      const user = await User.findOne({ where: { uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Récupérer tous les retraits pour cet utilisateur
      const withdrawals = await Withdrawal.findAll({
        where: { uniqueUserId }
      });

      return res.status(200).json({
        message: `Retraits de l'utilisateur ${uniqueUserId} récupérés avec succès.`,
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          uniqueId: w.uniqueId,
          fullName: w.fullName,
          pays: w.pays,
          reseauMobile: w.reseauMobile,
          phoneNumber: w.phoneNumber,
          montant: w.montant,
          statut: w.statut,
          date: w.date,
          created: w.created
        }))
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des retraits pour l'utilisateur ${uniqueUserId} :`, error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};