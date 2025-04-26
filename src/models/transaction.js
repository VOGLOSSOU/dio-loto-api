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
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le champ "sender" ne peut pas être vide.' },
          notNull: { msg: 'Le champ "sender" est requis.' }
        }
      },
      receiver: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le champ "receiver" ne peut pas être vide.' },
          notNull: { msg: 'Le champ "receiver" est requis.' }
        }
      },
      money: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          isFloat: { msg: 'Le montant doit être un nombre valide.' },
          min(value) {
            if (this.type === 'recharge' && (value < 500 || value > 500000)) {
              throw new Error('Pour une recharge, le montant doit être compris entre 500 et 500 000.');
            }
            if (this.type === 'retrait' && (value < 2000 || value > 2000000)) {
              throw new Error('Pour un retrait, le montant doit être compris entre 2 000 et 2 000 000.');
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
        defaultValue: function () {
          return this.type === 'recharge' ? 'validé' : 'en cours';
        },
        validate: {
          isIn: {
            args: [['en cours', 'validé', 'annulé']],
            msg: 'Le statut doit être "en cours", "validé" ou "annulé".'
          },
          notNull: { msg: 'Le statut est requis.' }
        }
      },
      type: {
        type: DataTypes.ENUM('recharge', 'retrait'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['recharge', 'retrait']],
            msg: 'Le type doit être "recharge" ou "retrait".'
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