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
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le nom doit contenir entre 2 et 50 caractères.'
        },
        notEmpty: { msg: 'Le nom ne peut pas être vide.' },
        notNull: { msg: 'Le nom est requis.' }
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le prénom doit contenir entre 2 et 50 caractères.'
        },
        notEmpty: { msg: 'Le prénom ne peut pas être vide.' },
        notNull: { msg: 'Le prénom est requis.' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Cet email est déjà utilisé.'
      },
      validate: {
        isEmail: { msg: "L'adresse email doit être valide." },
        notEmpty: { msg: "L'email ne peut pas être vide." },
        notNull: { msg: "L'email est requis." }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: 'Le mot de passe doit contenir entre 8 et 255 caractères.'
        },
        notEmpty: { msg: 'Le mot de passe ne peut pas être vide.' },
        notNull: { msg: 'Le mot de passe est requis.' }
      }
    },
    solde: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: 'Le solde doit être un nombre valide.' },
        notNull: { msg: 'Le solde est requis.' }
      }
    },
    gain: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: 'Le gain doit être un nombre valide.' },
        notNull: { msg: 'Le gain est requis.' }
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
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });
};