const { User, OtpCode } = require('../../db/sequelize');
const { sendOtpEmail } = require('../../utils/mailer');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        // On répond toujours avec succès pour ne pas révéler si l'email existe
        return res.json({ success: true, message: "Si cet email existe, un code a été envoyé." });
      }

      // Vérifier si l'email existe dans la base
      const user = await User.findOne({ where: { email } });

      // Que l'email existe ou non, on retourne le même message (sécurité)
      if (!user) {
        return res.json({ success: true, message: "Si cet email existe, un code a été envoyé." });
      }

      // Invalider les anciens codes non utilisés pour cet email
      await OtpCode.update(
        { used: true },
        { where: { email, used: false } }
      );

      // Générer un code OTP à 6 chiffres
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Calculer l'expiration (10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Sauvegarder en base
      await OtpCode.create({ email, otp, expiresAt, used: false });

      // Envoyer l'email
      await sendOtpEmail(email, otp);

      return res.json({ success: true, message: "Si cet email existe, un code a été envoyé." });

    } catch (error) {
      console.error("Erreur forgot-password :", error);
      return res.status(500).json({ success: false, message: "Erreur lors de l'envoi. Réessayez." });
    }
  });
};
