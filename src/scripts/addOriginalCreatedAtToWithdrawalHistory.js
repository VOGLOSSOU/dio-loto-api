const { sequelize } = require('../db/sequelize');

/**
 * Script pour ajouter le champ originalCreatedAt à la table WithdrawalHistory
 * Migration nécessaire après ajout du champ au modèle
 */
async function addOriginalCreatedAtToWithdrawalHistory() {
  try {
    console.log('🔄 Migration: Ajout du champ originalCreatedAt à WithdrawalHistory...');

    // Ajouter la colonne originalCreatedAt
    await sequelize.query(`
      ALTER TABLE WithdrawalHistories
      ADD COLUMN originalCreatedAt DATETIME NOT NULL COMMENT 'Date originale de création du retrait (avant archivage)';
    `);

    console.log('✅ Migration réussie !');
    console.log('   Nouveau champ ajouté: originalCreatedAt');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  addOriginalCreatedAtToWithdrawalHistory()
    .then(() => {
      console.log('🎉 Migration terminée avec succès !');
      console.log('   La table WithdrawalHistory a maintenant le champ originalCreatedAt');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration :', error);
      process.exit(1);
    });
}

module.exports = { addOriginalCreatedAtToWithdrawalHistory };