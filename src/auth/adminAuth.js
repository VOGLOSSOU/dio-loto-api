const jwt = require('jsonwebtoken');
const privateKey = require('./private_key');
const { Admin } = require('../db/sequelize');

/**
 * Authentification stricte réservée aux administrateurs.
 * Les tokens admin créés par /api/admins/login contiennent adminId.
 */
module.exports = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: "Un jeton d'administrateur valide est requis.",
      });
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const decodedToken = jwt.verify(token, privateKey);
    if (!decodedToken.adminId) {
      return res.status(403).json({
        message: 'Cette opération est réservée aux administrateurs.',
      });
    }

    const admin = await Admin.findByPk(decodedToken.adminId, {
      attributes: ['id', 'uniqueUserId', 'firstName', 'lastName', 'email'],
    });
    if (!admin) {
      return res.status(403).json({
        message: 'Le compte administrateur associé à ce jeton est introuvable.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Le jeton d'administrateur est invalide ou expiré.",
    });
  }
};
