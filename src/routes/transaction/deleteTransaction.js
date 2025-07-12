const { ResellerToUserTransaction, AdminToUserTransaction, Transaction, UserToUserTransaction, Admin } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.delete('/api/transactions/recharge/:uniqueTransacId/delete', auth, async (req, res) => {
    try {
      const { uniqueTransacId } = req.params;
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "L'identifiant de l'admin est requis." });
      }

      // Vérifie que l'admin existe
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ message: "Seul un administrateur peut supprimer une transaction." });
      }

      // Cherche la transaction dans toutes les tables
      let transaction = null;
      let transactionType = null;

      // 1. Chercher dans ResellerToUserTransaction
      transaction = await ResellerToUserTransaction.findOne({ where: { uniqueTransacId } });
      if (transaction) {
        transactionType = 'ResellerToUser';
      }

      // 2. Chercher dans AdminToUserTransaction
      if (!transaction) {
        transaction = await AdminToUserTransaction.findOne({ where: { uniqueTransacId } });
        if (transaction) {
          transactionType = 'AdminToUser';
        }
      }

      // 3. Chercher dans Transaction (admin-to-reseller)
      if (!transaction) {
        transaction = await Transaction.findOne({ where: { uniqueTransacId } });
        if (transaction) {
          transactionType = 'AdminToReseller';
        }
      }

      // 4. Chercher dans UserToUserTransaction
      if (!transaction) {
        transaction = await UserToUserTransaction.findOne({ where: { uniqueTransacId } });
        if (transaction) {
          transactionType = 'UserToUser';
        }
      }

      // Vérifier si la transaction a été trouvée
      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable dans aucune table." });
      }

      // Supprime la transaction (peu importe le statut - nettoyage de base)
      await transaction.destroy();

      res.status(200).json({
        message: "Transaction supprimée avec succès.",
        details: {
          transactionId: uniqueTransacId,
          transactionType: transactionType,
          deletedBy: `${admin.firstName} ${admin.lastName}`,
          deletedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction :', error);
      res.status(500).json({ message: "Une erreur est survenue lors de la suppression.", error });
    }
  });
};