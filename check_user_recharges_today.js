const { ResellerToUserTransaction } = require('./src/db/sequelize');
const moment = require('moment-timezone');

async function checkUserRechargesToday() {
  try {
    const userId = 'f1ff5002-4348-44ab-9f39-69fffecd63fb'; // L'utilisateur de la dernière recharge

    // Plage aujourd'hui en heure locale (comme dans le code)
    const todayBenin = moment().tz('Africa/Porto-Novo');
    const todayStart = todayBenin.clone().startOf('day');
    const todayEnd = todayBenin.clone().endOf('day');

    console.log('Plage locale:', todayStart.format('YYYY-MM-DD HH:mm:ss'), 'à', todayEnd.format('YYYY-MM-DD HH:mm:ss'));

    const todaysRecharges = await ResellerToUserTransaction.count({
      where: {
        receiver: userId,
        status: 'validé',
        created: {
          [require('sequelize').Op.between]: [todayStart.toDate(), todayEnd.toDate()]
        }
      }
    });

    console.log(`Nombre de recharges aujourd'hui pour ${userId}:`, todaysRecharges);

    // Lister les recharges
    const recharges = await ResellerToUserTransaction.findAll({
      where: {
        receiver: userId,
        status: 'validé',
        created: {
          [require('sequelize').Op.between]: [todayStart.toDate(), todayEnd.toDate()]
        }
      },
      order: [['created', 'ASC']]
    });

    console.log('Détails des recharges:');
    recharges.forEach(r => {
      console.log(`- ${r.created} : ${r.money} FCFA`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUserRechargesToday();