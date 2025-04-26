const { Transaction, Reseller, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge/:uniqueTransacId/cancel', auth, async (req, res) => {
    try {
      const { uniqueTransacId } = req.params;

      // Vérification si la transaction existe
      const transaction = await Transaction.findOne({ where: { uniqueTransacId } });
      if (!transaction) {
        return res.status(404).json({ message: "Aucune transaction trouvée avec cet identifiant unique." });
      }

      // Vérification si la transaction est de type recharge et validée
      if (transaction.type !== 'recharge' || transaction.status !== 'validé') {
        return res.status(400).json({ message: "Seules les recharges validées peuvent être annulées." });
      }

      // Vérification si le sender est un revendeur valide
      const reseller = await Reseller.findOne({ where: { uniqueResellerId: transaction.sender } });
      if (!reseller) {
        return res.status(404).json({ message: "Le revendeur associé à cette transaction est introuvable." });
      }

      // Vérification si le receiver est un utilisateur valide
      const user = await User.findOne({ where: { uniqueUserId: transaction.receiver } });
      if (!user) {
        return res.status(404).json({ message: "L'utilisateur associé à cette transaction est introuvable." });
      }

      // Mise à jour des soldes
      reseller.soldeRevendeur += transaction.money; // Ajouter le montant au solde du revendeur
      await reseller.save();

      user.solde -= transaction.money; // Soustraire le montant du solde de l'utilisateur
      await user.save();

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