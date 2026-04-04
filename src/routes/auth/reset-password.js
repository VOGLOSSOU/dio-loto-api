const { User, OtpCode } = require('../../db/sequelize');
const bcrypt = require('bcryptjs');

module.exports = (app) => {
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { reset_token, new_password } = req.body;

      if (!reset_token || !new_password) {
        return res.status(400).json({ success: false, message: "Token et nouveau mot de passe requis." });
      }

      // Chercher l'enregistrement OTP correspondant au reset_token, non utilisé
      const otpRecord = await OtpCode.findOne({
        where: { resetToken: reset_token, used: false }
      });

      // Vérifier existence et expiration du token
      if (!otpRecord || !otpRecord.resetTokenExpiresAt || new Date() > new Date(otpRecord.resetTokenExpiresAt)) {
        return res.status(400).json({ success: false, message: "Session expirée. Recommencez la procédure." });
      }

      // Trouver l'utilisateur associé à l'email
      const user = await User.findOne({ where: { email: otpRecord.email } });

      if (!user) {
        return res.status(400).json({ success: false, message: "Session expirée. Recommencez la procédure." });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Mettre à jour le mot de passe
      await user.update({ password: hashedPassword });

      // Invalider le code OTP et le token (used: true)
      await otpRecord.update({ used: true });

      return res.json({ success: true, message: "Mot de passe mis à jour avec succès." });

    } catch (error) {
      console.error("Erreur reset-password :", error);
      return res.status(500).json({ success: false, message: "Une erreur est survenue. Réessayez." });
    }
  });
};
