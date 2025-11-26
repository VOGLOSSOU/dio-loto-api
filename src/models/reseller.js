module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Reseller', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uniqueResellerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: {
        msg: 'Cet identifiant revendeur existe déjà.'
      },
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L’identifiant revendeur doit être un UUID version 4 valide.'
        },
        notNull: { msg: 'L’identifiant revendeur est requis.' }
      }
    },
    uniqueUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'uniqueUserId'
      }
    },
    soldeRevendeur: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: 'Le solde revendeur doit être un nombre valide.' },
        notNull: { msg: 'Le solde revendeur est requis.' }
      }
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9+ ]+$/i,
          msg: 'Le numéro WhatsApp doit contenir uniquement des chiffres, espaces ou le symbole "+".'
        }
      }
    },
    pays: {
      type: DataTypes.ENUM('Benin', 'Côte d\'Ivoire', 'Ghana', 'France', 'Togo'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Benin', 'Côte d\'Ivoire', 'Ghana', 'France', 'Togo']],
          msg: 'Le pays doit être l’un des suivants : Benin, Côte d\'Ivoire, Ghana, France, Togo.'
        },
        notNull: { msg: 'Le pays est requis.' }
      }
    },
    status: {
      type: DataTypes.ENUM('actif', 'bloqué'),
      allowNull: false,
      defaultValue: 'actif',
      validate: {
        isIn: {
          args: [['actif', 'bloqué']],
          msg: 'Le statut doit être soit "actif", soit "bloqué".'
        },
        notNull: { msg: 'Le statut est requis.' }
      }
    },
    // -------- Ajout du champ pseudo --------
    pseudo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le pseudo ne peut pas être vide.' },
        notNull: { msg: 'Le pseudo est requis.' }
      },
      unique: {
        msg: 'Ce pseudo est déjà utilisé.'
      }
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });
};