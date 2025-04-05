const { User } = require('../../db/sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const privateKey = require('../../auth/private_key');

module.exports = (app) => {
  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Vérification des entrées
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe sont requis." });
      }

      // Recherche de l'utilisateur
      const user = await User.findOne({ where: { email } });

      // Vérification de l'existence de l'utilisateur et du mot de passe
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Identifiants incorrects." });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { userId: user.id },
        privateKey,
        { expiresIn: '24h' }
      );

      return res.json({ message: "Connexion réussie.", data: user, token });

    } catch (error) {
      console.error("Erreur de connexion :", error);
      return res.status(500).json({
        message: "Une erreur est survenue. Veuillez réessayer plus tard.",
        data: error.message
      });
    }
  });
};