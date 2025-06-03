const { User, Reseller } = require('../../db/sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const privateKey = require('../../auth/private_key');

module.exports = (app) => {
  app.post('/api/resellers/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Vérifier que l'utilisateur existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Le revendeur demandé n'existe pas." });
      }

      // 2. Vérifier que l'utilisateur est bien revendeur actif
      const reseller = await Reseller.findOne({ where: { uniqueUserId: user.uniqueUserId, status: 'actif' } });
      if (!reseller) {
        return res.status(403).json({ message: "Ce compte utilisateur n'est pas un revendeur actif." });
      }

      // 3. Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Le mot de passe est incorrect." });
      }

      // 4. Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, resellerId: reseller.id },
        privateKey,
        { expiresIn: '24h' }
      );

      // 5. Retourner les infos utiles (sans le mot de passe)
      const { password: _, ...userSafe } = user.toJSON();

      return res.json({
        message: "Le revendeur a été connecté avec succès.",
        data: { user: userSafe, reseller },
        token
      });
    } catch (error) {
      res.status(500).json({
        message: "Le revendeur n'a pas pu être connecté. Réessayez dans quelques instants.",
        error: error.message
      });
    }
  });
};