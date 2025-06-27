const jwt = require('jsonwebtoken');
const privateKey = require('../auth/private_key');

module.exports = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: "Vous devez fournir un jeton d'authentification valide dans l'en-tête de la requête."
      });
    }

    const token = authorizationHeader.split(' ')[1]; // Récupération du token

    const decodedToken = jwt.verify(token, privateKey); // Vérification du token
    req.auth = { userId: decodedToken.userId }; // Stocker l'ID utilisateur dans `req`

    // Vérification de la cohérence entre l'ID du token et celui du body (si fourni)
    if (req.body.userId && req.body.userId !== decodedToken.userId) {
      return res.status(403).json({ message: "L'identifiant de l'utilisateur est invalide." });
    }

    next(); // Passer au middleware suivant si tout est OK

  } catch (error) {
    return res.status(401).json({
      message: "L'utilisateur n'est pas autorisé à accéder à cette ressource.",
      data: error.message
    });
  }
};