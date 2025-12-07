const { ResellerToUserTransaction, User } = require('./src/db/sequelize');
const moment = require('moment-timezone');

async function checkLastRechargeBonus() {
  try {
    // Trouver la dernière recharge reseller→user aujourd'hui (UTC)
    const today = moment().utc().format('YYYY-MM-DD');
    const lastRecharge = await ResellerToUserTransaction.findOne({
      where: {
        status: 'validé'
      },
      order: [['created', 'DESC']]
    });

    if (!lastRecharge) {
      console.log('Aucune recharge trouvée');
      return;
    }

    console.log('Dernière recharge:', {
      id: lastRecharge.id,
      sender: lastRecharge.sender,
      receiver: lastRecharge.receiver,
      money: lastRecharge.money,
      created: lastRecharge.created,
      date: lastRecharge.date
    });

    // Vérifier si c'était aujourd'hui
    const rechargeDate = moment(lastRecharge.created).utc().format('YYYY-MM-DD');
    console.log('Date de recharge (UTC):', rechargeDate);
    console.log('Aujourd\'hui (UTC):', today);
    console.log('Est-ce aujourd\'hui ?', rechargeDate === today);

    // Récupérer l'utilisateur
    const user = await User.findOne({
      where: { uniqueUserId: lastRecharge.receiver }
    });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return;
    }

    console.log('Utilisateur:', {
      uniqueUserId: user.uniqueUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      solde: user.solde,
      bonus: user.bonus
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkLastRechargeBonus();