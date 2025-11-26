module.exports = (sequelize, DataTypes) => {
  return sequelize.define('WithdrawalHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    originalId: { // ID du retrait original dans la table Withdrawals
      type: DataTypes.INTEGER,
      allowNull: true, // Peut être NULL pour les retraits supprimés avant le système d'historique
      comment: 'ID original du retrait avant archivage (NULL si supprimé avant implémentation)'
    },
    uniqueId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'UUID unique du retrait'
    },
    uniqueUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: {
          args: 4,
          msg: 'L\'identifiant utilisateur doit être un UUID version 4 valide.'
        },
        notNull: { msg: 'L\'identifiant utilisateur est requis.' }
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
      type: DataTypes.ENUM('Benin', 'Togo', 'Ghana', 'France', 'Côte d\'Ivoire'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Benin', 'Togo', 'Ghana', 'France', 'Côte d\'Ivoire']],
          msg: 'Le pays doit être l\'un des suivants : Benin, Togo, Ghana, France, Côte d\'Ivoire.'
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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'traité',
      comment: 'Statut au moment de l\'archivage (toujours traité)'
    },
    originalCreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date originale de création du retrait (avant archivage)'
    },
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date d\'archivage du retrait'
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: false, // Pas besoin d'updatedAt pour l'historique
    tableName: 'WithdrawalHistories' // Nom explicite de la table
  });
};