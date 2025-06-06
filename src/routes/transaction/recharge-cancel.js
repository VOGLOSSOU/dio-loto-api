const { ResellerToUserTransaction, Reseller, User, Admin, sequelize } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge/:uniqueTransacId/cancel', auth, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { uniqueTransacId } = req.params;
      const { adminId } = req.body;

      if (!adminId) {
        await t.rollback();
        return res.status(400).json({ message: "L'identifiant unique de l'admin est requis." });
      }

      const admin = await Admin.findOne({ where: { id: adminId }, transaction: t });
      if (!admin) {
        await t.rollback();
        return res.status(403).json({ message: "Seul un admin peut annuler une transaction." });
      }

      const transaction = await ResellerToUserTransaction.findOne({ where: { uniqueTransacId }, transaction: t });
      if (!transaction) {
        await t.rollback();
        return res.status(404).json({ message: "Aucune transaction trouvée avec cet identifiant unique." });
      }

      if (transaction.status !== 'validé') {
        await t.rollback();
        return res.status(400).json({ message: "Seules les transactions validées peuvent être annulées." });
      }

      const reseller = await Reseller.findOne({ where: { uniqueResellerId: transaction.sender }, transaction: t });
      const user = await User.findOne({ where: { uniqueUserId: transaction.receiver }, transaction: t });

      if (!reseller || !user) {
        await t.rollback();
        return res.status(404).json({ message: "Le revendeur ou l'utilisateur associé à cette transaction est introuvable." });
      }

      if (user.solde < transaction.money) {
        await t.rollback();
        return res.status(400).json({ message: "L'utilisateur n'a plus assez de solde pour annuler cette transaction." });
      }

      // Mise à jour des soldes
      user.solde -= transaction.money;
      await user.save({ transaction: t });

      reseller.soldeRevendeur += transaction.money;
      await reseller.save({ transaction: t });

      // Mise à jour du statut de la transaction
      transaction.status = 'invalidé';
      await transaction.save({ transaction: t });

      await t.commit();

      res.status(200).json({
        message: "La transaction a été annulée avec succès.",
        transaction
      });
    } catch (error) {
      await t.rollback();
      console.error('Erreur lors de l\'annulation de la transaction :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};