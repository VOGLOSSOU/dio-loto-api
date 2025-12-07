const { User } = require('./src/db/sequelize');
const { Op } = require('sequelize');

async function checkBonusRestored() {
  try {
    console.log('🔍 Vérification des utilisateurs avec bonus > 0...');

    const usersWithBonus = await User.findAll({
      where: {
        bonus: { [Op.gt]: 0 }
      },
      attributes: ['firstName', 'lastName', 'email', 'bonus']
    });

    console.log(`Utilisateurs avec bonus : ${usersWithBonus.length}`);

    let totalBonus = 0;
    usersWithBonus.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) : ${user.bonus} FCFA`);
      totalBonus += user.bonus;
    });

    console.log(`\n💰 Total bonus distribué : ${totalBonus} FCFA`);

  } catch (error) {
    console.error('❌ Erreur :', error);
  }
}

checkBonusRestored();