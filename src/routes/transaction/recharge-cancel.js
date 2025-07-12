const { ResellerToUserTransaction, Reseller, User, Admin, Notification, sequelize } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.patch('/api/transactions/recharge/:uniqueTransacId/cancel', auth, async (req, res) => {
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

      // ✅ Mise à jour des soldes : autoriser solde négatif
      user.solde -= transaction.money; // peut devenir négatif
      await user.save({ transaction: t });

      reseller.soldeRevendeur += transaction.money;
      await reseller.save({ transaction: t });

      // ✅ Mise à jour du statut
      transaction.status = 'invalidé';
      await transaction.save({ transaction: t });

      // ✅ Créer des notifications
      // Notification pour l'utilisateur
      await Notification.create({
        userId: user.uniqueUserId,
        type: 'autre',
        title: 'Recharge annulée par un administrateur',
        message: `Une recharge de ${transaction.money} FCFA effectuée par un revendeur a été annulée par l'administrateur ${admin.firstName} ${admin.lastName}. Votre nouveau solde est de ${user.solde} FCFA.`
      }, { transaction: t });

      // Notification pour le revendeur (récupérer l'utilisateur lié au revendeur)
      const resellerUser = await User.findOne({ where: { uniqueUserId: reseller.uniqueUserId }, transaction: t });
      if (resellerUser) {
        await Notification.create({
          userId: resellerUser.uniqueUserId,
          type: 'autre',
          title: 'Transaction annulée par un administrateur',
          message: `Votre transaction de ${transaction.money} FCFA vers ${user.firstName} ${user.lastName} a été annulée par l'administrateur ${admin.firstName} ${admin.lastName}. Votre nouveau solde revendeur est de ${reseller.soldeRevendeur} FCFA.`
        }, { transaction: t });
      }

      await t.commit();

      res.status(200).json({
        message: "Transaction annulée avec succès.",
        details: {
          transactionId: uniqueTransacId,
          montantAnnule: transaction.money,
          utilisateurConcerne: {
            email: user.email,
            ancienSolde: user.solde + transaction.money,
            nouveauSolde: user.solde
          },
          revendeurConcerne: {
            email: resellerUser?.email,
            ancienSoldeRevendeur: reseller.soldeRevendeur - transaction.money,
            nouveauSoldeRevendeur: reseller.soldeRevendeur
          },
          adminAuteur: {
            nom: `${admin.firstName} ${admin.lastName}`,
            email: admin.email
          },
          dateAnnulation: new Date()
        }
      });
    } catch (error) {
      await t.rollback();
      console.error('Erreur lors de l\'annulation de la transaction :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};