module.exports = (sequelize, DataTypes) => {
  return sequelize.define('OtpCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: { msg: 'Email invalide.' },
        notNull: { msg: 'L\'email est requis.' }
      }
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    // Généré après vérification OTP — permet l'étape reset-password
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    resetTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['resetToken'] }
    ]
  });
};
