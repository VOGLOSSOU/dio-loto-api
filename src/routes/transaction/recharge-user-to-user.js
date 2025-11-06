const { User, UserToUserTransaction, Notification } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/transactions/recharge-user-to-user', auth, async (req, res) => {
    try {
      const { uniqueUserId, montant } = req.body;

      // Vérification si l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Vérification du montant
      // if (montant < 500 || montant > 500000) {
      //   return res.status(400).json({ message: "Le montant de la recharge doit être compris entre 500 et 500 000." });
      // }

      // Vérification du gain suffisant
      if (user.gain < montant) {
        return res.status(400).json({ message: "Le montant de la recharge ne peut pas dépasser votre gain disponible." });
      }

      // Création de la transaction
      const transaction = await UserToUserTransaction.create({
        sender: user.uniqueUserId,
        receiver: user.uniqueUserId,
        money: montant,
        date: new Date(),
        status: 'validé'
      });

      // Mise à jour du gain et du solde de l'utilisateur
      user.gain -= montant;
      user.solde += montant;
      await user.save();

      // Création de la notification pour l'utilisateur
      await Notification.create({
        userId: user.uniqueUserId,
        type: 'recharge_user_to_user',
        title: 'Transfert de gain vers solde principal',
        message: `Vous avez transféré ${montant} FCFA de votre solde gain vers votre solde principal. Nouveau solde principal : ${user.solde} FCFA, nouveau solde gain : ${user.gain} FCFA.`
      });

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