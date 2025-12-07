const { Notification } = require('./src/db/sequelize');
const moment = require('moment-timezone');

async function checkUserNotifications() {
  try {
    const userId = 'f1ff5002-4348-44ab-9f39-69fffecd63fb';

    // Notifications aujourd'hui
    const today = moment().utc().format('YYYY-MM-DD');

    const notifications = await Notification.findAll({
      where: {
        userId: userId
      },
      order: [['created', 'DESC']],
      limit: 10
    });

    console.log(`Notifications pour ${userId} :`);
    notifications.forEach(n => {
      console.log(`- ${n.created}: ${n.title} - ${n.message.substring(0, 100)}...`);
      if (n.message.includes('BONUS SPÉCIAL')) {
        console.log('  *** CONTient BONUS SPÉCIAL ***');
      }
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUserNotifications();