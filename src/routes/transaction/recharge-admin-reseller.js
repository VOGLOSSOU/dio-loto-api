const { Admin, Reseller, Transaction, SoldeInitial } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge-admin-reseller', auth, async (req, res) => {
    try {
      const { email, montant, adminId } = req.body;

      // Vérification des champs obligatoires
      if (!email || !montant || !adminId) {
        return res.status(400).json({ message: 'L\'email, le montant et l\'identifiant admin sont requis.' });
      }

      // Vérification si l'admin existe
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette opération." });
      }

      // Vérification si le revendeur existe
      const reseller = await Reseller.findOne({ where: { email } });
      if (!reseller) {
        return res.status(404).json({ message: "Aucun revendeur trouvé avec cet email." });
      }

      // Vérification du solde système
      const montantInjecte = await SoldeInitial.sum('montant');
      const montantUtilise = await Transaction.sum('money', {
        where: { type: 'admin-to-reseller', status: 'validé' }
      });
      const montantRestant = (montantInjecte || 0) - (montantUtilise || 0);

      if (montantRestant < montant) {
        return res.status(400).json({
          message: `Solde insuffisant : il ne reste que ${montantRestant} FCFA dans le système. Veuillez compléter les fonds pour effectuer cette opération.`
        });
      }

      // Création de la transaction (UUID uniquement)
      const transaction = await Transaction.create({
        sender: admin.id,
        receiver: reseller.uniqueResellerId,
        money: montant,
        date: new Date(),
        status: 'validé',
        type: 'admin-to-reseller'
      });

      // Mise à jour du soldeRevendeur
      reseller.soldeRevendeur += montant;
      await reseller.save();

      res.status(201).json({
        message: `Le revendeur a été rechargé avec succès.`,
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de la recharge :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};