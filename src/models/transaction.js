module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Transaction', {
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
    sender: { // UUID de l'expéditeur (admin, reseller ou user)
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L\'identifiant de l\'expéditeur doit être un UUID valide.'
        },
        notNull: { msg: 'L\'identifiant de l\'expéditeur est requis.' }
      }
    },
    receiver: { // UUID du destinataire (reseller ou user)
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L\'identifiant du destinataire doit être un UUID valide.'
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
          if (value < 500 || value > 500000) {
            throw new Error('Pour une recharge, le montant doit être compris entre 500 et 500 000.');
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
      type: DataTypes.ENUM('en cours', 'validé', 'annulé'),
      allowNull: false,
      defaultValue: 'validé',
      validate: {
        isIn: {
          args: [['en cours', 'validé', 'annulé']],
          msg: 'Le statut doit être "en cours", "validé" ou "annulé".'
        },
        notNull: { msg: 'Le statut est requis.' }
      }
    },
    type: {
      type: DataTypes.ENUM('admin-to-reseller', 'reseller-to-user', 'user-to-user'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['admin-to-reseller', 'reseller-to-user', 'user-to-user']],
          msg: 'Le type doit être "admin-to-reseller", "reseller-to-user" ou "user-to-user".'
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