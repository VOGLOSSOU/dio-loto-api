const { Reseller, User, ResellerToUserTransaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge-reseller-user', auth, async (req, res) => {
    try {
      const { uniqueResellerId, email, montant } = req.body;

      // Vérification des champs obligatoires
      if (!uniqueResellerId || !email || !montant) {
        return res.status(400).json({ message: 'Le uniqueResellerId, l\'email et le montant sont requis.' });
      }

      // Vérification du montant
      if (montant < 500 || montant > 500000) {
        return res.status(400).json({ message: 'Le montant doit être compris entre 500 et 500 000.' });
      }

      // Vérification si le revendeur existe
      const reseller = await Reseller.findOne({ where: { uniqueResellerId } });
      if (!reseller) {
        return res.status(404).json({ message: "Aucun revendeur trouvé avec cet identifiant unique." });
      }

      // Vérification si le revendeur est actif
      if (reseller.status !== 'actif') {
        return res.status(403).json({ message: "Cette opération ne peut avoir lieu car le revendeur n'est pas actif." });
      }

      // Vérification si l'utilisateur existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });
      }

      // Vérification du solde du revendeur
      if (reseller.soldeRevendeur < montant) {
        return res.status(400).json({ message: "Le solde du revendeur est insuffisant pour effectuer cette opération." });
      }

      // Création de la transaction (UUID uniquement)
      const transaction = await ResellerToUserTransaction.create({
  sender: reseller.uniqueResellerId,
  receiver: user.uniqueUserId,
  money: montant,
  date: new Date(),
  status: 'validé',
});


      // Mise à jour du soldeRevendeur
      reseller.soldeRevendeur -= montant;
      await reseller.save();

      // Mise à jour du solde de l'utilisateur
      user.solde += montant;
      await user.save();

      res.status(201).json({
        message: `L'utilisateur ${user.lastName} ${user.firstName} a été rechargé avec succès.`,
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de la recharge :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};