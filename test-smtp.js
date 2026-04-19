require('dotenv').config();
const nodemailer = require('nodemailer');

// Diagnostic des valeurs chargées
console.log('SMTP_USER        :', process.env.SMTP_USER);
console.log('SMTP_PASSWORD    :', process.env.SMTP_PASSWORD ? '***défini***' : 'NON DÉFINI');
console.log('Password length  :', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0);
console.log('Password trimmed :', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.trim().length : 0);

async function main() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.trim() : ''
    },
    logger: true,
    debug: true,
    tls: { rejectUnauthorized: false }
  });

  const info = await transporter.sendMail({
    from: `"DIO LOTO" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: 'SMTP test depuis serveur Hostinger',
    text: 'Test de connexion SMTP réussi !'
  });

  console.log('✅ Email envoyé :', info.messageId);
}

main().catch((err) => {
  console.error('❌ SMTP FAIL :', err.message);
  process.exit(1);
});
