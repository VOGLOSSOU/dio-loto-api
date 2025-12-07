const { Notification } = require('./src/db/sequelize');
const moment = require('moment-timezone');

async function checkTodayNotificationsBonus() {
  try {
    // Plage aujourd'hui en UTC
    const today = moment().utc().format('YYYY-MM-DD');

    // Récupérer toutes les notifications créées aujourd'hui
    const notifications = await Notification.findAll({
      where: {},
      order: [['created', 'DESC']]
    });

    console.log(`Notifications totales : ${notifications.length}`);

    // Filtrer celles d'aujourd'hui
    const todayNotifications = notifications.filter(n => {
      const notifDate = moment(n.created).utc().format('YYYY-MM-DD');
      return notifDate === today;
    });

    console.log(`Notifications aujourd'hui : ${todayNotifications.length}`);

    let bonusNotifications = 0;
    let normalRechargeNotifications = 0;

    todayNotifications.forEach(n => {
      if (n.message.includes('BONUS SPÉCIAL') || n.message.includes('bonus')) {
        bonusNotifications++;
        console.log(`[BONUS] ${n.created} - ${n.title} - User: ${n.userId}`);
      } else if (n.type === 'recharge_reseller') {
        normalRechargeNotifications++;
        console.log(`[NORMAL] ${n.created} - ${n.title} - User: ${n.userId}`);
      }
    });

    console.log(`\nRésumé :`);
    console.log(`- Notifications de recharge normale : ${normalRechargeNotifications}`);
    console.log(`- Notifications avec bonus : ${bonusNotifications}`);

    if (bonusNotifications > 0) {
      console.log('✅ Des utilisateurs ont reçu le bonus aujourd\'hui.');
    } else {
      console.log('❌ Aucun utilisateur n\'a reçu le bonus aujourd\'hui.');
    }

  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkTodayNotificationsBonus();