const nodemailer = require('nodemailer');

module.exports = (app) => {
  app.get('/test-smtp', async (req, res) => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    console.log('[TEST-SMTP] SMTP_USER     :', user);
    console.log('[TEST-SMTP] Password length:', pass ? pass.length : 0);
    console.log('[TEST-SMTP] Password trim  :', pass ? pass.trim().length : 0);

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      family: 4,
      auth: { user, pass: pass ? pass.trim() : '' },
      logger: true,
      debug: true,
      tls: { rejectUnauthorized: false }
    });

    try {
      const info = await transporter.sendMail({
        from: `"DIO LOTO" <${user}>`,
        to: user,
        subject: 'SMTP test depuis serveur Hostinger',
        text: 'Test réussi !'
      });
      res.json({ ok: true, messageId: info.messageId, user, passwordLength: pass ? pass.length : 0 });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message, user, passwordLength: pass ? pass.length : 0 });
    }
  });
};
