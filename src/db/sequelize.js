require('dotenv').config()
const { Sequelize, DataTypes } = require('sequelize')
const UserModel = require('../models/user')
const AdminModel = require('../models/admin')
const ResellerModel = require('../models/reseller')
const TransactionModel = require('../models/transaction')
const SoldeInitialModel = require('../models/soldeInitial')
const GameModel = require('../models/game')
const ScheduleModel = require('../models/schedule')

// Connexion sécurisée avec des variables d'environnement
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  dialectOptions: {
    connectTimeout: 40000,
  },
  logging: false
})

const User = UserModel(sequelize, DataTypes)
const Admin = AdminModel(sequelize, DataTypes)
const Reseller = ResellerModel(sequelize, DataTypes)
const Transaction = TransactionModel(sequelize, DataTypes)
const SoldeInitial = SoldeInitialModel(sequelize, DataTypes)
const Game = GameModel(sequelize, DataTypes)
const Schedule = ScheduleModel(sequelize, DataTypes)

// Charger les associations
Game.associate({ Schedule });
Schedule.associate({ Game });

const initDb = async () => {
  try {

    await sequelize.sync({ alter: true })
    console.log('La base de données a bien été initialisée !')

  } catch (error) {
    console.error("Erreur lors de l'initialisation :", error)
  }
}

module.exports = { 
  initDb, User, Admin, Reseller, Transaction, SoldeInitial, Game, Schedule
}