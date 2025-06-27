module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Games',
        key: 'id'
      }
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
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
    },
    timezone: {
      type: DataTypes.ENUM(
        'Africa/Porto-Novo', // Bénin
        'Africa/Lome',       // Togo
        'Africa/Abidjan',    // Côte d'Ivoire
        'Africa/Accra',      // Ghana
        'Africa/Niamey'      // Niger
      ),
      allowNull: false,
      validate: {
        notNull: { msg: 'Le fuseau horaire est requis.' },
        isIn: {
          args: [['Africa/Porto-Novo', 'Africa/Lome', 'Africa/Abidjan', 'Africa/Accra', 'Africa/Niamey']],
          msg: 'Le fuseau horaire doit être l’un des suivants : Africa/Porto-Novo, Africa/Lome, Africa/Abidjan, Africa/Accra, Africa/Niamey.'
        }
      }
    }
  });

  // Définir l'association avec Game
  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Game, {
      foreignKey: 'gameId',
      as: 'game', // Alias pour l'association
    });
  };

  return Schedule;
};