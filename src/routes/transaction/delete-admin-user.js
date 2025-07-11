const { AdminToUserTransaction, Admin, User, SoldeInitial, Notification } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * DELETE /api/transactions/admin-to-user/:uniqueTransacId/cancel
   * Annule une recharge admin → user en invalidant la transaction,
   * retournant l'argent au solde système et débitant l'utilisateur
   */
  app.delete('/api/transactions/admin-to-user/:uniqueTransacId/cancel', auth, async (req, res) => {
    try {
      const { uniqueTransacId } = req.params;
      const { adminId } = req.body;

      // Validation des paramètres
      if (!adminId) {
        return res.status(400).json({ message: "L'identifiant de l'admin est requis." });
      }

      // Vérifier que l'admin existe
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ message: "Seul un administrateur peut annuler une transaction." });
      }

      // Chercher la transaction admin → user
      const transaction = await AdminToUserTransaction.findOne({
        where: { uniqueTransacId }
      });
      if (!transaction) {
        return res.status(404).json({ message: "Transaction introuvable." });
      }

      // Vérifier le statut de la transaction
      if (transaction.status === 'invalidé') {
        return res.status(400).json({ message: "Cette transaction a déjà été annulée." });
      }
      if (transaction.status !== 'validé') {
        return res.status(400).json({ message: "Seules les transactions validées peuvent être annulées." });
      }

      // Récupérer l'utilisateur concerné
      const user = await User.findOne({ where: { uniqueUserId: transaction.userReceiver } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur concerné par la transaction introuvable." });
      }

      // 1. Invalider la transaction
      transaction.status = 'invalidé';
      await transaction.save();

      // 2. Retourner l'argent au solde système
      await SoldeInitial.create({
        montant: transaction.money,
        auteur: `${admin.firstName} ${admin.lastName}`,
        date: new Date()
      });

      // 3. Débiter l'utilisateur (même si son solde devient négatif)
      user.solde -= transaction.money;
      await user.save();

      // 4. Créer une notification pour l'utilisateur
      await Notification.create({
        userId: user.uniqueUserId,
        type: 'autre',
        title: 'Recharge annulée par un administrateur',
        message: `Une recharge de ${transaction.money} FCFA effectuée le ${transaction.date.toLocaleDateString()} a été annulée par l'administrateur ${admin.firstName} ${admin.lastName}. Votre nouveau solde est de ${user.solde} FCFA.`
      });

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
          adminAuteur: {
            nom: `${admin.firstName} ${admin.lastName}`,
            email: admin.email
          },
          dateAnnulation: new Date()
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'annulation de la transaction admin-to-user :', error);
      res.status(500).json({
        message: "Une erreur est survenue lors de l'annulation de la transaction.",
        error: error.message
      });
    }
  });
};