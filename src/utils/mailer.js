const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // TLS via STARTTLS
  family: 4,     // Forcer IPv4 — Render ne supporte pas IPv6 sortant
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Envoie un email OTP pour la réinitialisation de mot de passe.
 * @param {string} toEmail - Adresse du destinataire
 * @param {string} otp - Code OTP à 6 chiffres
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: '"DIO LOTO" <support@dioloto.online>',
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe DIO LOTO',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a1a2e; text-align: center;">DIO LOTO</h2>
        <p style="color: #333;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p style="color: #333;">Voici votre code de vérification :</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="
            display: inline-block;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 12px;
            color: #ffffff;
            background-color: #e63946;
            padding: 16px 32px;
            border-radius: 8px;
          ">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Ce code expire dans <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© DIO LOTO — support@dioloto.online</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
