module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('ouvert', 'fermé'),
      defaultValue: 'ouvert'
    },
    pays: {
      type: DataTypes.ENUM('Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo']],
          msg: 'Le pays doit être l’un des suivants : Benin, Côte d\'Ivoire, Ghana, Niger, Togo.'
        },
        notNull: { msg: 'Le pays est requis.' }
      }
    }
  });

  // VOICI la seule méthode associate pour Game :
  Game.associate = (models) => {
    // 1. Un jeu peut avoir plusieurs créneaux (Schedule)
    Game.hasMany(models.Schedule, {
      foreignKey: 'gameId',
      as: 'schedules'
    });

    // 2. Un jeu peut avoir un seul résultat (Result)
    Game.hasOne(models.Result, {
      foreignKey: 'gameId',
      as: 'result'
    });

    // Si tu devais ajouter d'autres associations (Ticket, Transaction…),
    // les déclarer ici aussi.
  };

  return Game;
};