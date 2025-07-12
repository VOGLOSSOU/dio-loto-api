const { ResellerToUserTransaction, Admin } = require('../../db/sequelize');
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

      // Cherche la transaction
      const transaction = await ResellerToUserTransaction.findOne({ where: { uniqueTransacId } });
      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable." });
      }

      // Supprime la transaction (peu importe le statut - nettoyage de base)
      await transaction.destroy();

      res.status(200).json({ message: "Transaction supprimée avec succès." });
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction :', error);
      res.status(500).json({ message: "Une erreur est survenue lors de la suppression.", error });
    }
  });
};