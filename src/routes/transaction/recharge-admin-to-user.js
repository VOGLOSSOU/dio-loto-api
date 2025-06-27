const { Admin, User, AdminToUserTransaction, SoldeInitial, Transaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/admin-to-user', auth, async (req, res) => {
    try {
      const { email, montant, adminId } = req.body;

      // Vérification des champs obligatoires
      if (!email || !montant || !adminId) {
        return res.status(400).json({ message: "L'email, le montant et l'identifiant admin sont requis." });
      }

      // Vérifier l'existence de l'admin
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ message: "Admin non autorisé à effectuer cette opération." });
      }

      // Vérifier l'existence de l'utilisateur
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable avec cet email." });
      }

      // Vérification du solde système
      const montantInjecte = await SoldeInitial.sum('montant');

const montantAdminToReseller = await Transaction.sum('money', {
  where: { type: 'admin-to-reseller', status: 'validé' }
});

const montantAdminToUser = await AdminToUserTransaction.sum('money', {
  where: { status: 'validé' }
});

const montantUtilise = (montantAdminToReseller || 0) + (montantAdminToUser || 0);
const montantRestant = (montantInjecte || 0) - montantUtilise;

if (montantRestant < montant) {
  return res.status(400).json({
    message: `Solde insuffisant : il ne reste que ${montantRestant} FCFA dans le système. Veuillez compléter les fonds.`
  });
}

      // Création de la transaction
      const transaction = await AdminToUserTransaction.create({
        adminSender: admin.uniqueUserId,
        userReceiver: user.uniqueUserId,
        money: montant,
        status: 'validé',
        date: new Date()
      });

      // Mise à jour du solde de l'utilisateur
      user.solde += montant;
      await user.save();

      res.status(201).json({
        message: `L'utilisateur a été crédité avec succès.`,
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de la transaction admin-to-user :', error);
      res.status(500).json({ message: "Une erreur est survenue lors de la transaction.", error });
    }
  });
};