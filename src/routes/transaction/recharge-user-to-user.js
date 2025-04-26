const { User, Transaction } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge-user-to-user', auth, async (req, res) => {
    try {
      const { uniqueUserId , montant } = req.body;

      // Vérification si l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Vérification si le montant est inférieur ou égal au gain
      if (montant < 5000) {
          return res.status(400).json({ message: "Le montant de la recharge ne peut pas être en dessous de 5000." });
      }

      // Vérification si le gain est supérieur ou égal à 5000
      if (user.gain < 5000) {
          return res.status(400).json({ message: "Votre gain doit être supérieur ou égal à 5000 pour effectuer cette opération." });
      }

      // Vérification si le montant est inférieur ou égal au gain
      if (montant > user.gain) {
          return res.status(400).json({ message: "Le montant de la recharge ne peut pas dépasser votre gain disponible." });
      }


      // Création de la transaction
      const transaction = await Transaction.create({
        sender: uniqueUserId,
        receiver: uniqueUserId,
        money: montant,
        date: new Date(),
        status: 'validé',
        type: 'recharge'
      });

      // Mise à jour du gain et du solde de l'utilisateur
      user.gain -= montant; // Débiter le gain
      user.solde += montant; // Créditer le solde
      await user.save();

      res.status(201).json({
        message: "Votre recharge a été effectuée avec succès.",
        transaction
      });
    } catch (error) {
      console.error('Erreur lors de la recharge :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};