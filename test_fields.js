const { ResellerToUserTransaction } = require('./src/db/sequelize');

async function testFields() {
  try {
    const test = await ResellerToUserTransaction.findOne();
    if (test) {
      console.log('Champs disponibles:', Object.keys(test.dataValues));
      console.log('Exemple de données:', test.dataValues);
    } else {
      console.log('Aucune transaction trouvée');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testFields();