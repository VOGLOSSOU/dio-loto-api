const { Reseller, User, ResellerToUserTransaction, Notification } = require('../../db/sequelize');
const auth = require('../../auth/auth');
const moment = require('moment-timezone');
const { Op } = require('sequelize');

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
      const reseller = await Reseller.findOne({
        where: { uniqueResellerId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }]
      });
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

      // VÉRIFICATION BONUS : Seulement lundi 24 novembre 2025 (heure Bénin)
      const todayBenin = moment().tz('Africa/Porto-Novo');
      const isBonusDay = todayBenin.isSame('2025-11-24', 'day');

      let bonusAmount = 0;
      let isFirstRechargeToday = false;

      if (isBonusDay) {
        // Vérifier si c'est la première recharge du jour pour cet utilisateur
        const todayStart = todayBenin.clone().startOf('day');
        const todayEnd = todayBenin.clone().endOf('day');

        const todaysRecharges = await ResellerToUserTransaction.count({
          where: {
            receiver: user.uniqueUserId,
            status: 'validé',
            created: {
              [Op.between]: [todayStart.toDate(), todayEnd.toDate()]
            }
          }
        });

        if (todaysRecharges === 0) {
          // Première recharge du jour → Appliquer bonus 10%
          bonusAmount = Math.round(montant * 0.1 * 100) / 100; // 10% arrondi à 2 décimales
          isFirstRechargeToday = true;
        }
      }

      // Création de la transaction
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
      if (bonusAmount > 0) {
        user.bonus += bonusAmount;
      }
      await user.save();

      // Création de la notification pour l'utilisateur
      let notificationMessage = '';
      if (bonusAmount > 0) {
        // Notification avec bonus
        notificationMessage = `🎉 BONUS SPÉCIAL ! Vous venez de recevoir ${bonusAmount} FCFA de bonus sur votre recharge de ${montant} FCFA. Total crédité : ${montant + bonusAmount} FCFA. Utilisez votre bonus complètement avant minuit, sinon il disparaîtra ! Nouveau solde : ${user.solde} FCFA, Bonus : ${user.bonus} FCFA.`;
      } else {
        // Notification normale
        notificationMessage = `Votre compte a été rechargé de ${montant} FCFA par le revendeur ${reseller.user?.firstName || 'N/A'} ${reseller.user?.lastName || 'N/A'}. Nouveau solde : ${user.solde} FCFA.`;
      }

      await Notification.create({
        userId: user.uniqueUserId,
        type: bonusAmount > 0 ? 'recharge_bonus' : 'recharge_reseller',
        title: bonusAmount > 0 ? '🎉 Recharge avec Bonus Spécial !' : 'Recharge effectuée par un revendeur',
        message: notificationMessage
      });

      // Réponse avec infos bonus si applicable
      const response = {
        message: bonusAmount > 0
          ? `🎉 BONUS SPÉCIAL ! L'utilisateur ${user.lastName} ${user.firstName} a été rechargé de ${montant} FCFA + ${bonusAmount} FCFA de bonus !`
          : `L'utilisateur ${user.lastName} ${user.firstName} a été rechargé avec succès.`,
        transaction,
        bonusApplied: bonusAmount > 0,
        bonusDetails: bonusAmount > 0 ? {
          montantRecharge: montant,
          bonusRecu: bonusAmount,
          totalCredite: montant + bonusAmount,
          nouveauSolde: user.solde,
          nouveauBonus: user.bonus,
          isFirstRechargeToday
        } : null
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la recharge :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};