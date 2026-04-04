const { OtpCode } = require('../../db/sequelize');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : require('uuid');

module.exports = (app) => {
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email et code OTP requis." });
      }

      // Chercher le code OTP le plus récent pour cet email, non utilisé
      const otpRecord = await OtpCode.findOne({
        where: { email, otp, used: false },
        order: [['createdAt', 'DESC']]
      });

      // Vérifier existence, expiration
      if (!otpRecord || new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ success: false, message: "Code invalide ou expiré." });
      }

      // Générer un reset_token (UUID) valable 15 minutes
      const resetToken = require('crypto').randomUUID();
      const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Sauvegarder le token dans l'enregistrement OTP (pas encore marqué used)
      await otpRecord.update({ resetToken, resetTokenExpiresAt });

      return res.json({ success: true, reset_token: resetToken });

    } catch (error) {
      console.error("Erreur verify-otp :", error);
      return res.status(500).json({ success: false, message: "Une erreur est survenue. Réessayez." });
    }
  });
};
