const { Sequelize, DataTypes } = require('sequelize');

// Configuration de la base de données (même que dans sequelize.js)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: false,
});

/**
 * Script pour ajouter le champ userBalanceAtCreation à la table Tickets
 * et définir la valeur par défaut à null pour les tickets existants
 */
async function addUserBalanceAtCreationField() {
  try {
    console.log('🔄 Ajout du champ userBalanceAtCreation à la table Tickets...');

    // Connexion à la DB
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier si le champ existe déjà
    const tableDescription = await sequelize.getQueryInterface().describeTable('Tickets');

    if (tableDescription.userBalanceAtCreation) {
      console.log('⚠️ Le champ userBalanceAtCreation existe déjà');
      return;
    }

    // Ajouter le champ
    await sequelize.getQueryInterface().addColumn('Tickets', 'userBalanceAtCreation', {
      type: DataTypes.FLOAT,
      allowNull: true, // Permet null pour les tickets existants
      defaultValue: null,
      comment: 'Solde de l\'utilisateur au moment de la création du ticket'
    });

    console.log('✅ Champ userBalanceAtCreation ajouté avec succès');

    // Vérifier que tous les tickets existants ont null
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM Tickets WHERE userBalanceAtCreation IS NOT NULL');
    const existingRecords = results[0].count;

    if (existingRecords > 0) {
      console.log(`⚠️ ${existingRecords} tickets existants ont déjà une valeur - vérification nécessaire`);
    } else {
      console.log('✅ Tous les tickets existants ont null comme attendu');
    }

    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  console.log('🚀 Lancement de la migration userBalanceAtCreation...');

  addUserBalanceAtCreationField()
    .then(() => {
      console.log('✅ Migration terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { addUserBalanceAtCreationField };