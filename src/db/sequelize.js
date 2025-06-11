// src/db/sequelize.js

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// 1) Import de toutes les factory functions de vos modèles (sans rien changer)
const UserModel                        = require('../models/user');
const AdminModel                       = require('../models/admin');
const ResellerModel                    = require('../models/reseller');
const TransactionModel                 = require('../models/transaction');
const SoldeInitialModel                = require('../models/soldeInitial');
const GameModel                        = require('../models/game');
const ScheduleModel                    = require('../models/schedule');
const TicketModel                      = require('../models/ticket');
const WithdrawalModel                  = require('../models/withdrawal');
const ResellerToUserTransactionModel   = require('../models/resellerToUserTransactions');
const UserToUserTransactionModel       = require('../models/userToUserTransactions');
const AdminToUserTransactionModel = require('../models/adminToUserTransaction');
const ResultModel                      = require('../models/result');

// 2) Création de la connexion Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    dialectOptions: { connectTimeout: 40000 },
    logging: false
  }
);

// 3) Initialisation de chaque modèle
const User                       = UserModel(sequelize, DataTypes);
const Admin                      = AdminModel(sequelize, DataTypes);
const Reseller                   = ResellerModel(sequelize, DataTypes);
const Transaction                = TransactionModel(sequelize, DataTypes);
const SoldeInitial               = SoldeInitialModel(sequelize, DataTypes);
const Game                       = GameModel(sequelize, DataTypes);
const Schedule                   = ScheduleModel(sequelize, DataTypes);
const Ticket                     = TicketModel(sequelize, DataTypes);
const Withdrawal                 = WithdrawalModel(sequelize, DataTypes);
const ResellerToUserTransaction  = ResellerToUserTransactionModel(sequelize, DataTypes);
const UserToUserTransaction      = UserToUserTransactionModel(sequelize, DataTypes);
const AdminToUserTransaction     = AdminToUserTransactionModel(sequelize, DataTypes);
const Result                     = ResultModel(sequelize, DataTypes);

// ───────────────────────────────────────────────────────────────────────────────
// 4) Associations **SEULEMENT** pour Game, Schedule et Result (manuelles ici)
// ───────────────────────────────────────────────────────────────────────────────

// 4.1) Un Game peut avoir plusieurs Schedule
Game.hasMany(Schedule, {
  foreignKey: 'gameId',
  as: 'schedules'
});

// 4.2) Chaque Schedule appartient à un Game
Schedule.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'game'
});

// 4.3) Un Game peut avoir un seul Result
Game.hasOne(Result, {
  foreignKey: 'gameId',
  as: 'result'
});

// 4.4) Chaque Result appartient à un Game
Result.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'game'
});

// ───────────────────────────────────────────────────────────────────────────────
// 5) Vos autres associations (copiées telles qu’elles étaient)
//     - Ici, on ne touche **pas** aux blocs `associate` des autres modèles.
//     - Vous pouvez donc laisser exactement le code que vous aviez,
//       par exemple :
// ───────────────────────────────────────────────────────────────────────────────

// Association entre User et Reseller
User.hasOne(Reseller, {
  foreignKey: 'uniqueUserId',
  sourceKey: 'uniqueUserId',
  as: 'reseller'
});
Reseller.belongsTo(User, {
  foreignKey: 'uniqueUserId',
  targetKey: 'uniqueUserId',
  as: 'user'
});

// Association Ticket ↔ User
Ticket.belongsTo(User, {
  foreignKey: 'uniqueUserId',
  targetKey: 'uniqueUserId',
  as: 'User'
});
User.hasMany(Ticket, {
  foreignKey: 'uniqueUserId',
  sourceKey: 'uniqueUserId',
  as: 'Tickets'
});

// Associations pour Transaction (Admin ↔ Transaction, Reseller ↔ Transaction)
Transaction.belongsTo(Admin, {
  foreignKey: 'sender',
  targetKey: 'uniqueUserId',
  as: 'admin'
});
Transaction.belongsTo(Reseller, {
  foreignKey: 'receiver',
  targetKey: 'uniqueResellerId',
  as: 'reseller'
});

// Association ResellerToUserTransaction ↔ Reseller, ↔ User
ResellerToUserTransaction.belongsTo(Reseller, {
  foreignKey: 'sender',
  targetKey: 'uniqueResellerId',
  as: 'reseller'
});
ResellerToUserTransaction.belongsTo(User, {
  foreignKey: 'receiver',
  targetKey: 'uniqueUserId',
  as: 'user'
});

// Association UserToUserTransaction ↔ User (pour sender et receiver)
UserToUserTransaction.belongsTo(User, {
  foreignKey: 'sender',
  targetKey: 'uniqueUserId',
  as: 'senderUser'
});
UserToUserTransaction.belongsTo(User, {
  foreignKey: 'receiver',
  targetKey: 'uniqueUserId',
  as: 'receiverUser'
});

AdminToUserTransaction.belongsTo(Admin, {
  foreignKey: 'adminSender',          // Doit correspondre au champ de ta table
  targetKey: 'uniqueUserId',
  as: 'admin'
});

AdminToUserTransaction.belongsTo(User, {
  foreignKey: 'userReceiver',         // Doit correspondre au champ de ta table
  targetKey: 'uniqueUserId',
  as: 'user'
});

// Si vous avez d’autres associations pour SoldeInitial ou Withdrawal, etc.,
// vous les laissez telles quelles :
// Par exemple :
SoldeInitial.belongsTo(User, {
  foreignKey: 'uniqueUserId',
  targetKey: 'uniqueUserId',
  as: 'user'
});
Withdrawal.belongsTo(User, {
  foreignKey: 'uniqueUserId',
  targetKey: 'uniqueUserId',
  as: 'user'
});

// (Et ainsi de suite pour les éventuelles autres relations que vous aviez.) 

// ───────────────────────────────────────────────────────────────────────────────
// 6) Synchronisation de la base (sans toucher ici non plus)
// ───────────────────────────────────────────────────────────────────────────────
const initDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('La base de données a bien été initialisée !');
  } catch (error) {
    console.error("Erreur lors de l'initialisation :", error);
  }
};

module.exports = {
  sequelize,
  initDb,
  // Exportez aussi les modèles pour les utiliser ailleurs
  User,
  Admin,
  Reseller,
  Transaction,
  SoldeInitial,
  Game,
  Schedule,
  Ticket,
  Withdrawal,
  ResellerToUserTransaction,
  UserToUserTransaction,
  AdminToUserTransaction,
  Result
};