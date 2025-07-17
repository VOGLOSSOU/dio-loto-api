require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Connexion à la base de données
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: console.log, // Activer les logs pour voir les requêtes SQL
});

// Script de migration pour ajouter le champ manualOverride
const addManualOverrideField = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie.');

    // Vérifier si la colonne existe déjà
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'Games' 
      AND COLUMN_NAME = 'manualOverride'
    `);

    if (results.length > 0) {
      console.log('⚠️  La colonne manualOverride existe déjà dans la table Games.');
      return;
    }

    // Ajouter la colonne manualOverride
    await sequelize.query(`
      ALTER TABLE Games 
      ADD COLUMN manualOverride BOOLEAN NOT NULL DEFAULT FALSE 
      COMMENT 'Indique si le statut a été modifié manuellement par un admin'
    `);

    console.log('✅ Colonne manualOverride ajoutée avec succès à la table Games.');

    // Vérifier que tous les jeux ont manualOverride = false par défaut
    const [games] = await sequelize.query('SELECT nom, manualOverride FROM Games');
    console.log('📊 État des jeux après migration :');
    games.forEach(game => {
      console.log(`   - ${game.nom}: manualOverride = ${game.manualOverride}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion à la base de données fermée.');
  }
};

// Exécution du script
addManualOverrideField();
