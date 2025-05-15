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

  // Définir l'association avec Schedule
  Game.associate = (models) => {
    Game.hasMany(models.Schedule, {
      foreignKey: 'gameId',
      as: 'schedules', // Alias pour l'association
    });
  };

  return Game;
};