const { Admin } = require('../../db/sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const privateKey = require('../../auth/private_key');

module.exports = (app) => {
  app.post('/api/admins/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Vérification des entrées
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe sont requis." });
      }

      // Recherche de l'utilisateur
      const admin = await Admin.findOne({ where: { email } });

      // Vérification de l'existence de l'utilisateur et du mot de passe
      if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.status(401).json({ message: "Identifiants incorrects." });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { adminId:admin.id },
        privateKey,
        { expiresIn: '24h' }
      );

      return res.json({ message: "Connexion réussie.", data: admin, token });

    } catch (error) {
      console.error("Erreur de connexion :", error);
      return res.status(500).json({
        message: "Une erreur est survenue. Veuillez réessayer plus tard.",
        data: error.message
      });
    }
  });
};