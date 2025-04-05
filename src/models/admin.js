module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Admin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le nom de famille doit contenir entre 2 et 50 caractères.'
        },
        is: {
          args: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u,
          msg: 'Le nom de famille ne doit contenir que des lettres, espaces ou apostrophes.'
        },
        notEmpty: { msg: 'Le nom de famille ne peut pas être vide.' },
        notNull: { msg: 'Le nom de famille est une propriété requise.' }
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
        is: {
          args: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u,
          msg: 'Le prénom ne doit contenir que des lettres, espaces ou apostrophes.'
        },
        notEmpty: { msg: 'Le prénom ne peut pas être vide.' },
        notNull: { msg: 'Le prénom est une propriété requise.' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_email_constraint',
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
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: false
  });
};