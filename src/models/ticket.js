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
      allowNull: false,
      unique: true
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
    gain: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    statut: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "en cours de traitement"
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });
};