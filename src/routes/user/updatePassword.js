const { User } = require('../../db/sequelize');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.put('/api/users/:id/password', auth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const { id } = req.params;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "L'ancien et le nouveau mot de passe sont requis." });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Vérifier que l'ancien mot de passe est correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect." });
      }

      // Hasher et sauvegarder le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      return res.json({ message: "Mot de passe mis à jour avec succès." });

    } catch (error) {
      console.error("Erreur updatePassword :", error);
      return res.status(500).json({ message: "Une erreur est survenue. Veuillez réessayer." });
    }
  });
};
