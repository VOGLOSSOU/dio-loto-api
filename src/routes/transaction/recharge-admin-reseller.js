const { Admin, Reseller, SoldeInitial, Transaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge-admin-reseller', auth, async (req, res) => {
    try {
      const { email, montant, uniqueUserId } = req.body;

      // Vérification des champs obligatoires
      if (!email || !montant || !uniqueUserId) {
        return res.status(400).json({ message: 'L\'email, le montant et le uniqueUserId sont requis.' });
      }

      // Vérification si l'admin existe
      const admin = await Admin.findOne({ where: { uniqueUserId } });
      if (!admin) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette opération." });
      }

      // Vérification si le revendeur existe
      const reseller = await Reseller.findOne({ where: { email } });
      if (!reseller) {
        return res.status(404).json({ message: "Aucun revendeur trouvé avec cet email." });
      }

      // Vérification du solde initial
      const soldeInitial = await SoldeInitial.findOne();
      if (!soldeInitial || soldeInitial.montant <= montant) {
        return res.status(400).json({ message: "Le solde initial est insuffisant pour effectuer cette opération." });
      }

      // Création de la transaction
      const transaction = await Transaction.create({
        sender: uniqueUserId,
        receiver: reseller.uniqueResellerId,
        money: montant,
        date: new Date(),
        status: 'validé',
        type: 'recharge'
      });

      // Mise à jour du soldeRevendeur
      reseller.soldeRevendeur += montant;
      await reseller.save();

      // Mise à jour du solde initial
      soldeInitial.montant -= montant;
      await soldeInitial.save();

      res.status(201).json({
        message: `Le revendeur ${reseller.lastName} ${reseller.firstName} a été rechargé avec succès.`,
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de la recharge :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};