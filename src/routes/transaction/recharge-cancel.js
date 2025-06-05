const { Transaction, Reseller, User, Admin } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge/:uniqueTransacId/cancel', auth, async (req, res) => {
    try {
      const { uniqueTransacId } = req.params;
      const { uniqueUserId } = req.body;

      // Vérification admin
      if (!uniqueUserId) {
        return res.status(400).json({ message: "L'identifiant unique de l'admin est requis." });
      }
      const admin = await Admin.findOne({ where: { uniqueUserId } });
      if (!admin) {
        return res.status(403).json({ message: "Seul un admin peut annuler une transaction." });
      }

      // Vérification transaction
      const transaction = await Transaction.findOne({ where: { uniqueTransacId } });
      if (!transaction) {
        return res.status(404).json({ message: "Aucune transaction trouvée avec cet identifiant unique." });
      }

      // On n'annule que les transactions reseller-to-user validées
      if (transaction.type !== 'reseller-to-user' || transaction.status !== 'validé') {
        return res.status(400).json({ message: "Seules les recharges revendeur vers utilisateur validées peuvent être annulées." });
      }

      // Vérification des acteurs
      const reseller = await Reseller.findOne({ where: { uniqueResellerId: transaction.sender } });
      const user = await User.findOne({ where: { uniqueUserId: transaction.receiver } });
      if (!reseller || !user) {
        return res.status(404).json({ message: "Le revendeur ou l'utilisateur associé à cette transaction est introuvable." });
      }

      // Vérification du solde utilisateur
      if (user.solde < transaction.money) {
        return res.status(400).json({ message: "L'utilisateur n'a plus assez de solde pour annuler cette transaction." });
      }

      // Mise à jour des soldes
      user.solde -= transaction.money;
      await user.save();

      reseller.soldeRevendeur += transaction.money;
      await reseller.save();

      // Mise à jour du statut de la transaction
      transaction.status = 'annulé';
      await transaction.save();

      res.status(200).json({
        message: "La transaction a été annulée avec succès.",
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la transaction :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};