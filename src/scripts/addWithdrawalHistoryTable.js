const { sequelize } = require('../db/sequelize');

/**
 * Script pour créer la table WithdrawalHistory
 * À exécuter une seule fois pour ajouter la nouvelle table à la base de données
 */
async function createWithdrawalHistoryTable() {
  try {
    console.log('🔄 Création de la table WithdrawalHistory...');

    // Créer la table manuellement avec SQL
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS WithdrawalHistories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        originalId INT NOT NULL COMMENT 'ID original du retrait avant archivage',
        uniqueId VARCHAR(255) NOT NULL COMMENT 'UUID unique du retrait',
        uniqueUserId VARCHAR(255) NOT NULL,
        fullName VARCHAR(100) NOT NULL,
        pays ENUM('Benin', 'Togo', 'Ghana', 'France', 'Côte d\\'Ivoire') NOT NULL,
        reseauMobile VARCHAR(50) NOT NULL,
        phoneNumber VARCHAR(20) NOT NULL,
        montant FLOAT NOT NULL,
        statut VARCHAR(50) NOT NULL DEFAULT 'traité' COMMENT 'Statut au moment de l\\'archivage (toujours traité)',
        deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d\\'archivage du retrait',
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_original_id (originalId),
        INDEX idx_unique_user_id (uniqueUserId),
        INDEX idx_deleted_at (deletedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table WithdrawalHistory créée avec succès !');
    console.log('   Structure: id, originalId, uniqueId, uniqueUserId, fullName, pays, reseauMobile, phoneNumber, montant, statut, deletedAt, created');

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table WithdrawalHistory :', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  createWithdrawalHistoryTable()
    .then(() => {
      console.log('🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration :', error);
      process.exit(1);
    });
}

module.exports = { createWithdrawalHistoryTable };