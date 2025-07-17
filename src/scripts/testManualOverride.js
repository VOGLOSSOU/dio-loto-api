require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const GameModel = require('../models/game');

// Connexion à la base de données
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: false,
});

// Initialisation du modèle Game
const Game = GameModel(sequelize, DataTypes);

// Script de test pour le système de contrôle manuel
const testManualOverride = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie.');

    // Test 1: Vérifier l'état initial des jeux
    console.log('\n🔍 === TEST 1: État initial des jeux ===');
    const games = await Game.findAll({
      attributes: ['nom', 'statut', 'manualOverride'],
      order: [['nom', 'ASC']]
    });

    games.forEach(game => {
      const mode = game.manualOverride ? '🔒 MANUEL' : '🤖 AUTO';
      console.log(`   ${game.nom}: ${game.statut} (${mode})`);
    });

    // Test 2: Simuler un changement manuel
    console.log('\n🔧 === TEST 2: Simulation changement manuel ===');
    const testGame = await Game.findOne({ where: { nom: 'benin11' } });
    if (testGame) {
      console.log(`Avant: ${testGame.nom} - statut: ${testGame.statut}, manualOverride: ${testGame.manualOverride}`);
      
      // Simuler un changement manuel
      testGame.statut = testGame.statut === 'ouvert' ? 'fermé' : 'ouvert';
      testGame.manualOverride = true;
      await testGame.save();
      
      console.log(`Après: ${testGame.nom} - statut: ${testGame.statut}, manualOverride: ${testGame.manualOverride}`);
    }

    // Test 3: Vérifier les jeux en mode manuel
    console.log('\n🔒 === TEST 3: Jeux en mode manuel ===');
    const manualGames = await Game.findAll({
      where: { manualOverride: true },
      attributes: ['nom', 'statut', 'manualOverride']
    });

    if (manualGames.length > 0) {
      console.log(`Nombre de jeux en mode manuel: ${manualGames.length}`);
      manualGames.forEach(game => {
        console.log(`   🔒 ${game.nom}: ${game.statut} (contrôle manuel actif)`);
      });
    } else {
      console.log('Aucun jeu en mode manuel.');
    }

    // Test 4: Remettre en mode automatique
    console.log('\n🤖 === TEST 4: Remise en mode automatique ===');
    if (testGame) {
      testGame.manualOverride = false;
      await testGame.save();
      console.log(`${testGame.nom} remis en mode automatique.`);
    }

    // Test 5: État final
    console.log('\n📊 === TEST 5: État final ===');
    const finalGames = await Game.findAll({
      attributes: ['nom', 'statut', 'manualOverride'],
      order: [['nom', 'ASC']]
    });

    const autoCount = finalGames.filter(g => !g.manualOverride).length;
    const manualCount = finalGames.filter(g => g.manualOverride).length;

    console.log(`Total jeux: ${finalGames.length}`);
    console.log(`Mode automatique: ${autoCount}`);
    console.log(`Mode manuel: ${manualCount}`);

    console.log('\n✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests :', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion fermée.');
  }
};

// Exécution du script
testManualOverride();
