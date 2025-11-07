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

// Liste des jeux à insérer
const games = [
  { nom: 'benin11', description: 'Disponible dès 14h00 et devient indisponible à partir de 10h55.', pays: 'Benin', doubleChance: false },
  { nom: 'benin14', description: 'Disponible dès 17h00 et devient indisponible à partir de 13h55.', pays: 'Benin', doubleChance: false },
  { nom: 'benin18', description: 'Disponible dès 21h00 et devient indisponible à partir de 17h55.', pays: 'Benin', doubleChance: false },
  { nom: 'benin21', description: 'Disponible dès 00h00 et devient indisponible à partir de 20h55.', pays: 'Benin', doubleChance: false },
  { nom: 'benin00', description: 'Disponible dès 03h00 et devient indisponible à partir de 23h55.', pays: 'Benin', doubleChance: false },
  { nom: 'togo8', description: 'Disponible dès 10h00 et devient indisponible à partir de 08h55.', pays: 'Togo', doubleChance: true },
  { nom: 'togo13', description: 'Disponible dès 16h00 et devient indisponible à partir de 12h55.', pays: 'Togo', doubleChance: false },
  { nom: 'togo18', description: 'Disponible dès 21h00 et devient indisponible à partir de 17h55.', pays: 'Togo', doubleChance: false },
  { nom: 'coteivoire7', description: 'Disponible dès 10h00 et devient indisponible à partir de 06h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire8', description: 'Disponible dès 11h00 et devient indisponible à partir de 07h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire10', description: 'Disponible dès 13h00 et devient indisponible à partir de 09h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire13', description: 'Disponible dès 16h00 et devient indisponible à partir de 12h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire16', description: 'Disponible dès 19h00 et devient indisponible à partir de 15h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire21', description: 'Disponible dès 00h00 et devient indisponible à partir de 20h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire22', description: 'Disponible dès 01h00 et devient indisponible à partir de 21h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire23', description: 'Disponible dès 02h00 et devient indisponible à partir de 22h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire1', description: 'Disponible dès 04h00 et devient indisponible à partir de 00h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'coteivoire3', description: 'Disponible dès 06h00 et devient indisponible à partir de 02h55.', pays: 'Côte d\'Ivoire', doubleChance: true },
  { nom: 'ghana20', description: 'Disponible dès 23h00 et devient indisponible à partir de 19h55.', pays: 'Ghana', doubleChance: true },
  { nom: 'niger15', description: 'Disponible dès 18h00 et devient indisponible à partir de 14h55.', pays: 'Niger', doubleChance: false },
];

// Fonction pour insérer les jeux
const insertGames = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    // Synchronisation du modèle Game
    await Game.sync();

    // Insertion des jeux
    for (const game of games) {
      await Game.create(game);
    }

    console.log('Les jeux ont été insérés avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des jeux :', error);
  } finally {
    await sequelize.close();
    console.log('Connexion à la base de données fermée.');
  }
};

// Exécution du script
insertGames();