const { User, Reseller } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/auth/check-role', auth, async (req, res) => {
    try {
      const { email } = req.body;

      // Vérification si l'email est fourni
      if (!email) {
        return res.status(400).json({ message: "L'email est requis." });
      }

      // Vérification si l'utilisateur existe dans la table Users
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Vérification si l'utilisateur est un revendeur
      const reseller = await Reseller.findOne({ where: { email } });
      if (reseller) {
        // Si le revendeur existe, on vérifie son statut avant de le considérer comme tel
        if (reseller.status === 'actif') {
          return res.status(200).json({
            message: "Succès : utilisateur identifié comme revendeur.",
            role: "reseller",
            resellerInfo: reseller
          });
        }
        // Si le revendeur n'est pas actif, on le traite comme un user simple
      }

      // Si l'utilisateur n'est pas un revendeur actif, renvoyer un message pour un utilisateur simple
      return res.status(200).json({
        message: "Succès : utilisateur identifié comme utilisateur simple.",
        role: "user",
        userInfo: user
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle :', error);
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};