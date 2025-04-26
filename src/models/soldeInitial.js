module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SoldeInitial', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      montant: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          isFloat: { msg: 'Le montant doit être un nombre valide.' },
          min: {
            args: [0],
            msg: 'Le montant doit être supérieur ou égal à 0.'
          },
          notNull: { msg: 'Le montant est requis.' }
        }
      },
      auteur: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le champ "auteur" ne peut pas être vide.' },
          notNull: { msg: 'Le champ "auteur" est requis.' }
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: { msg: 'La date doit être valide.' },
          notNull: { msg: 'La date est requise.' }
        }
      }
    }, {
      timestamps: true,
      createdAt: 'created',
      updatedAt: false // Pas besoin de champ "updatedAt" pour ce modèle
    });
  };