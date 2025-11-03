module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numeroTicket: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    uniqueUserId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    heureJeu: {
      type: DataTypes.DATE,
      allowNull: false
    },
    nomJeu: {
      type: DataTypes.STRING,
      allowNull: false
    },
    typeJeu: {
      type: DataTypes.STRING,
      allowNull: false
    },
    numerosJoues: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('numerosJoues');
        try {
          return JSON.parse(rawValue);
        } catch {
          return rawValue;
        }
      },
      set(val) {
        this.setDataValue('numerosJoues', JSON.stringify(val));
      }
    },
    formule: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mise: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    gains: {
  type: DataTypes.TEXT,
  allowNull: false,
  get() {
    const rawValue = this.getDataValue('gains');
    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  },
  set(val) {
    this.setDataValue('gains', JSON.stringify(val));
  }
},
isCart: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false
},
    statut: {
  type: DataTypes.ENUM('en attente', 'validé', 'invalidé', 'attribué'),
  allowNull: false,
  defaultValue: 'en attente',
  validate: {
    isIn: {
      args: [['en attente', 'validé', 'invalidé', 'attribué']],
      msg: 'Le statut doit être "en attente", "validé", "invalidé" ou "attribué".'
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