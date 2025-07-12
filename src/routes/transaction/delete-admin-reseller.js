const { Transaction, Admin, Reseller, User, SoldeInitial, Notification } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * PATCH /api/transactions/admin-to-reseller/:uniqueTransacId/cancel
   * Annule une recharge admin → revendeur en invalidant la transaction,
   * retournant l'argent au solde système et débitant le revendeur
   */
  app.patch('/api/transactions/admin-to-reseller/:uniqueTransacId/cancel', auth, async (req, res) => {
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

      // Chercher la transaction admin → revendeur
      const transaction = await Transaction.findOne({
        where: {
          uniqueTransacId,
          type: 'admin-to-reseller'
        }
      });
      if (!transaction) {
        return res.status(404).json({ message: "Transaction admin-to-reseller introuvable." });
      }

      // Vérifier le statut de la transaction
      if (transaction.status === 'invalidé') {
        return res.status(400).json({ message: "Cette transaction a déjà été annulée." });
      }
      if (transaction.status !== 'validé') {
        return res.status(400).json({ message: "Seules les transactions validées peuvent être annulées." });
      }

      // Récupérer le revendeur concerné
      const reseller = await Reseller.findOne({ where: { uniqueResellerId: transaction.receiver } });
      if (!reseller) {
        return res.status(404).json({ message: "Revendeur concerné par la transaction introuvable." });
      }

      // Récupérer l'utilisateur lié au revendeur (pour la notification)
      const user = await User.findOne({ where: { uniqueUserId: reseller.uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur lié au revendeur introuvable." });
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

      // 3. Débiter le revendeur (même si son solde devient négatif)
      reseller.soldeRevendeur -= transaction.money;
      await reseller.save();

      // 4. Créer une notification pour le revendeur
      await Notification.create({
        userId: user.uniqueUserId, // Le revendeur est avant tout un user
        type: 'autre',
        title: 'Recharge revendeur annulée par un administrateur',
        message: `Une recharge de ${transaction.money} FCFA effectuée le ${transaction.date.toLocaleDateString()} a été annulée par l'administrateur ${admin.firstName} ${admin.lastName}. Votre nouveau solde revendeur est de ${reseller.soldeRevendeur} FCFA.`
      });

      res.status(200).json({
        message: "Transaction annulée avec succès.",
        details: {
          transactionId: uniqueTransacId,
          montantAnnule: transaction.money,
          revendeurConcerne: {
            email: user.email,
            pseudo: reseller.pseudo,
            ancienSoldeRevendeur: reseller.soldeRevendeur + transaction.money,
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
      console.error('Erreur lors de l\'annulation de la transaction admin-to-reseller :', error);
      res.status(500).json({
        message: "Une erreur est survenue lors de l'annulation de la transaction.",
        error: error.message
      });
    }
  });
};