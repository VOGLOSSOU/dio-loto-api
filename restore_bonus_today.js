const { ResellerToUserTransaction, User, Notification } = require('./src/db/sequelize');
const moment = require('moment-timezone');

async function restoreBonusToday() {
  try {
    console.log('🚀 Début de la restauration du bonus pour aujourd\'hui...');

    // Plage aujourd'hui (même que dans la route)
    const todayBenin = moment().tz('Africa/Porto-Novo');
    const todayStart = todayBenin.clone().startOf('day');
    const todayEnd = todayBenin.clone().endOf('day');

    console.log(`Plage : ${todayStart.format('YYYY-MM-DD HH:mm:ss')} à ${todayEnd.format('YYYY-MM-DD HH:mm:ss')} (heure Bénin)`);

    // Récupérer toutes les recharges validées aujourd'hui
    const todaysRecharges = await ResellerToUserTransaction.findAll({
      where: {
        status: 'validé',
        created: {
          [require('sequelize').Op.between]: [todayStart.toDate(), todayEnd.toDate()]
        }
      },
      order: [['created', 'ASC']]
    });

    console.log(`Total recharges aujourd'hui : ${todaysRecharges.length}`);

    // Grouper par utilisateur et prendre la première recharge
    const firstRechargesByUser = {};
    todaysRecharges.forEach(recharge => {
      const userId = recharge.receiver;
      if (!firstRechargesByUser[userId]) {
        firstRechargesByUser[userId] = recharge;
      }
    });

    const firstRecharges = Object.values(firstRechargesByUser);
    console.log(`Premières recharges par utilisateur : ${firstRecharges.length}`);

    let restoredCount = 0;
    let usersWithExistingBonus = [];

    for (const recharge of firstRecharges) {
      const user = await User.findOne({ where: { uniqueUserId: recharge.receiver } });
      if (!user) {
        console.log(`❌ Utilisateur ${recharge.receiver} non trouvé`);
        continue;
      }

      if (user.bonus > 0) {
        usersWithExistingBonus.push(user.uniqueUserId);
        console.log(`⚠️ Utilisateur ${user.firstName} ${user.lastName} (${user.uniqueUserId}) a déjà ${user.bonus} bonus`);
        continue;
      }

      // Calculer le bonus
      const bonusAmount = Math.round(recharge.money * 0.1 * 100) / 100;
      user.bonus += bonusAmount;
      await user.save();

      console.log(`✅ Bonus restauré pour ${user.firstName} ${user.lastName} : +${bonusAmount} FCFA (recharge ${recharge.money} FCFA)`);

      // Envoyer notification spéciale
      const notificationMessage = `🎉 BONUS RESTAURÉ ! Le bonus de ${bonusAmount} FCFA pour votre première recharge de ${recharge.money} FCFA aujourd'hui vient de vous être accordé. Nous sommes désolés pour le bug qui a retardé l'arrivée du bonus. Nouveau solde bonus : ${user.bonus} FCFA.`;

      await Notification.create({
        userId: user.uniqueUserId,
        type: 'bonus_restored',
        title: '🎉 Bonus Restauré - Désolés pour le Retard !',
        message: notificationMessage
      });

      restoredCount++;
    }

    console.log(`\n📊 Résumé :`);
    console.log(`- Premières recharges traitées : ${firstRecharges.length}`);
    console.log(`- Bonus restaurés : ${restoredCount}`);
    if (usersWithExistingBonus.length > 0) {
      console.log(`- Utilisateurs avec bonus existant : ${usersWithExistingBonus.join(', ')}`);
    } else {
      console.log(`- Aucun utilisateur n'avait de bonus existant.`);
    }

    console.log('🎉 Restauration terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration :', error);
  }
}

restoreBonusToday();