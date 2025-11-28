// routes/getWithdrawalsByUser.js

const { Withdrawal, WithdrawalHistory, User } = require('../../db/sequelize');

module.exports = (app) => {
  /**
   * GET /api/withdrawals/user/:uniqueUserId
   * Récupère tous les retraits associés à un utilisateur donné (via uniqueUserId).
   * Inclut aussi les retraits archivés (supprimés) en les présentant comme "traité".
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

      // Récupérer tous les retraits actifs pour cet utilisateur
      const activeWithdrawals = await Withdrawal.findAll({
        where: { uniqueUserId }
      });

      // Récupérer tous les retraits archivés pour cet utilisateur
      const archivedWithdrawals = await WithdrawalHistory.findAll({
        where: { uniqueUserId }
      });

      // Formater les retraits actifs (même format que avant)
      const formattedActiveWithdrawals = activeWithdrawals.map(w => ({
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
      }));

      // Formater les retraits archivés (même format, présentés comme "traité")
      const formattedArchivedWithdrawals = archivedWithdrawals.map(w => ({
        id: w.id, // Utiliser l'ID original (pas de préfixe)
        uniqueId: w.uniqueId,
        fullName: w.fullName,
        pays: w.pays,
        reseauMobile: w.reseauMobile,
        phoneNumber: w.phoneNumber,
        montant: w.montant,
        statut: 'traité', // Toujours présenté comme traité
        date: w.originalCreatedAt, // Date originale de création
        created: w.originalCreatedAt
      }));

      // Fusionner les deux listes
      const allWithdrawals = [...formattedActiveWithdrawals, ...formattedArchivedWithdrawals];

      // Trier par date de création (plus récent en premier)
      allWithdrawals.sort((a, b) => new Date(b.created) - new Date(a.created));

      // Retourner EXACTEMENT le même format qu'avant
      return res.status(200).json({
        message: `Retraits de l'utilisateur ${uniqueUserId} récupérés avec succès.`,
        withdrawals: allWithdrawals
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des retraits pour l'utilisateur ${uniqueUserId} :`, error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};