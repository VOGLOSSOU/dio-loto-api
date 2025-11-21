require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const GameModel = require('../models/game');
const ScheduleModel = require('../models/schedule');

// Connexion à la base de données
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: false,
});

// Initialisation des modèles
const Game = GameModel(sequelize, DataTypes);
const Schedule = ScheduleModel(sequelize, DataTypes);

// Liste des horaires à insérer (avec le nom du jeu comme référence)
const schedules = [
  { nom: 'benin11', startTime: '14:00:00', endTime: '10:55:00', pays: 'Benin', timezone: 'Africa/Porto-Novo' },
  { nom: 'benin14', startTime: '17:00:00', endTime: '13:55:00', pays: 'Benin', timezone: 'Africa/Porto-Novo' },
  { nom: 'benin18', startTime: '21:00:00', endTime: '17:55:00', pays: 'Benin', timezone: 'Africa/Porto-Novo' },
  { nom: 'benin21', startTime: '00:00:00', endTime: '20:55:00', pays: 'Benin', timezone: 'Africa/Porto-Novo' },
  { nom: 'benin00', startTime: '03:00:00', endTime: '23:55:00', pays: 'Benin', timezone: 'Africa/Porto-Novo' },

  { nom: 'togo9', startTime: '12:00:00', endTime: '08:55:00', pays: 'Togo', timezone: 'Africa/Lome' },
  { nom: 'togo13', startTime: '16:00:00', endTime: '12:55:00', pays: 'Togo', timezone: 'Africa/Lome' },
  { nom: 'togo18', startTime: '21:00:00', endTime: '17:55:00', pays: 'Togo', timezone: 'Africa/Lome' },

  { nom: 'coteivoire7',  startTime: '10:00:00', endTime: '06:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire8',  startTime: '11:00:00', endTime: '07:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' }, // Nouveau jeu 8h
  { nom: 'coteivoire10', startTime: '13:00:00', endTime: '09:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire13', startTime: '16:00:00', endTime: '12:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire16', startTime: '19:00:00', endTime: '15:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire21', startTime: '00:00:00', endTime: '20:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire22', startTime: '01:00:00', endTime: '21:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' }, // Nouveau jeu 22h
  { nom: 'coteivoire23', startTime: '02:00:00', endTime: '22:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire1',  startTime: '04:00:00', endTime: '00:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },
  { nom: 'coteivoire3',  startTime: '06:00:00', endTime: '02:55:00', pays: 'Côte d\'Ivoire', timezone: 'Africa/Abidjan' },

  { nom: 'ghana20', startTime: '22:00:00', endTime: '18:55:00', pays: 'Ghana', timezone: 'Africa/Accra' },
  { nom: 'niger15', startTime: '18:00:00', endTime: '14:55:00', pays: 'Niger', timezone: 'Africa/Niamey' },
];

// Fonction pour insérer les horaires
const insertSchedules = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    // Synchronisation du modèle Schedule
    await Schedule.sync();

    // Insertion des horaires
    for (const schedule of schedules) {
      // Récupérer le gameId en fonction du nom
      const game = await Game.findOne({ where: { nom: schedule.nom } });
      if (!game) {
        console.error(`Jeu introuvable pour le nom : ${schedule.nom}`);
        continue;
      }

      // Insérer l'horaire avec le gameId
      await Schedule.create({
        gameId: game.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        pays: schedule.pays,
        timezone: schedule.timezone,
      });
    }

    console.log('Les horaires ont été insérés avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des horaires :', error);
  } finally {
    await sequelize.close();
    console.log('Connexion à la base de données fermée.');
  }
};

// Exécution du script
insertSchedules();