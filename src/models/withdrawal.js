module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Withdrawal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uniqueId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: {
        msg: 'Cet identifiant de retrait existe déjà.'
      },
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L’identifiant de retrait doit être un UUID version 4 valide.'
        },
        notNull: { msg: 'L’identifiant de retrait est requis.' }
      }
    },
    userUniqueId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L’identifiant utilisateur doit être un UUID version 4 valide.'
        },
        notNull: { msg: 'L’identifiant utilisateur est requis.' }
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Le nom complet doit contenir entre 2 et 100 caractères.'
        },
        notEmpty: { msg: 'Le nom complet ne peut pas être vide.' },
        notNull: { msg: 'Le nom complet est requis.' }
      }
    },
    pays: {
      type: DataTypes.ENUM('Benin', 'Togo', 'Ghana', 'Niger', 'Côte d\'Ivoire'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Benin', 'Togo', 'Ghana', 'Niger', 'Côte d\'Ivoire']],
          msg: 'Le pays doit être l’un des suivants : Benin, Togo, Ghana, Niger, Côte d\'Ivoire.'
        },
        notNull: { msg: 'Le pays est requis.' }
      }
    },
    reseauMobile: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le réseau mobile doit contenir entre 2 et 50 caractères.'
        },
        notEmpty: { msg: 'Le réseau mobile ne peut pas être vide.' },
        notNull: { msg: 'Le réseau mobile est requis.' }
      }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[0-9+ ]+$/i,
          msg: 'Le numéro de téléphone doit contenir uniquement des chiffres, espaces ou le symbole "+".'
        },
        notEmpty: { msg: 'Le numéro de téléphone ne peut pas être vide.' },
        notNull: { msg: 'Le numéro de téléphone est requis.' }
      }
    },
    montant: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: { msg: 'Le montant de retrait doit être un nombre valide.' },
        min: {
          args: [2000],
          msg: 'Le montant de retrait doit être au moins de 2 000.'
        },
        max: {
          args: [200000],
          msg: 'Le montant de retrait ne peut pas dépasser 200 000.'
        },
        notNull: { msg: 'Le montant de retrait est requis.' }
      }
    },
    statut: {
      type: DataTypes.ENUM('en cours de traitement', 'traité'),
      allowNull: false,
      defaultValue: 'en cours de traitement',
      validate: {
        isIn: {
          args: [['en cours de traitement', 'traité']],
          msg: 'Le statut doit être "en cours de traitement" ou "traité".'
        },
        notNull: { msg: 'Le statut est requis.' }
      }
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });
};