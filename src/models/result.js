// models/result.js

module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define(
    'Result',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // Stocke les numéros gagnants sous forme de chaîne (ex. "4,12,23,34,45,56")
      numbers: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Les numéros gagnants ne peuvent pas être vides.' },
          notNull: { msg: 'Le champ "numbers" est requis.' }
        }
      },
      // Nouveau champ pour la double chance
      numbers2: {
        type: DataTypes.STRING,
        allowNull: true, // Peut rester null pour les jeux sans double chance
        validate: {
          // Optionnel : tu peux ajouter une validation si besoin
        }
      },
      // Clé étrangère vers le jeu concerné
      gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Games',         // Doit correspondre au nom de la table 'Games'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
          notNull: { msg: 'L’identifiant du jeu est requis.' }
        }
      }
      // Note : Sequelize ajoute automatiquement createdAt et updatedAt si 'timestamps: true'
    },
    {
      tableName: 'Results',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: false  // On n’a pas besoin d’updatedAt ici si on ne modifie pas un résultat
    }
  );

  Result.associate = (models) => {
    // Résultat appartient à un Game
    Result.belongsTo(models.Game, {
      foreignKey: 'gameId',
      as: 'game'
    });
  };

  return Result;
};