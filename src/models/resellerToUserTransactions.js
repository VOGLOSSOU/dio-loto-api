module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ResellerToUserTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uniqueTransacId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: {
        msg: 'Cet identifiant de transaction existe déjà.'
      },
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L’identifiant de transaction doit être un UUID version 4 valide.'
        },
        notNull: { msg: 'L’identifiant de transaction est requis.' }
      }
    },
    sender: { // UUID du revendeur (reseller)
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L\'identifiant de l\'expéditeur est invalide.'
        },
        notNull: { msg: 'L\'identifiant de l\'expéditeur est requis.' }
      }
    },
    receiver: { // UUID de l’utilisateur final
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L\'identifiant du destinataire est invalide.'
        },
        notNull: { msg: 'L\'identifiant du destinataire est requis.' }
      }
    },
    money: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: { msg: 'Le montant doit être un nombre valide.' },
        min(value) {
          if (value < 100 || value > 100000) {
            throw new Error('Pour une transaction reseller-to-user, le montant doit être entre 100 et 100 000.');
          }
        },
        notNull: { msg: 'Le montant est requis.' }
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
    },
    status: {
  type: DataTypes.ENUM('validé', 'invalidé', 'en attente'),
  allowNull: false,
  defaultValue: 'validé',
  validate: {
    isIn: {
      args: [['validé', 'invalidé', 'en attente']],
      msg: 'Le statut doit être "validé", "invalidé" ou "en attente".'
    },
    notNull: { msg: 'Le statut est requis.' }
  }
},
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'reseller-to-user',
      validate: {
        isIn: {
          args: [['reseller-to-user']],
          msg: 'Le type doit être "reseller-to-user".'
        },
        notNull: { msg: 'Le type est requis.' }
      }
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });
};