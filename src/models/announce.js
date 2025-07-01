module.exports = (sequelize, DataTypes) => {
  const Annonce = sequelize.define('Annonce', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Le titre est requis." }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "La description est requise." }
      }
    }
  }, {
    timestamps: true,
    createdAt: 'created',
    updatedAt: true
  });

  return Annonce;
};