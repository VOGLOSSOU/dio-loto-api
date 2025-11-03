module.exports = (sequelize, DataTypes) => {
  return sequelize.define('DailyProfit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY, // DATE sans heure
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'La date est requise.' },
        isDate: { msg: 'La date doit être valide.' }
      }
    },
    totalRecharges: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Le total des recharges doit être un nombre valide.' },
        min: 0
      }
    },
    totalWithdrawals: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Le total des retraits doit être un nombre valide.' },
        min: 0
      }
    },
    totalSalaries: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Le total des salaires doit être un nombre valide.' },
        min: 0
      }
    },
    netProfit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Le bénéfice net doit être un nombre valide.' }
      }
    }
  }, {
    tableName: 'DailyProfits',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['date']
      },
      {
        fields: ['createdAt']
      }
    ]
  });
};