require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: { rejectUnauthorized: false }
});

console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***défini***' : 'NON DÉFINI');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connexion SMTP échouée :', error.message);
  } else {
    console.log('✅ Connexion SMTP réussie ! Les credentials sont corrects.');
  }
});
