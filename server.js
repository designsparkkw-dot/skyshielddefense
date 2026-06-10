const express  = require('express');
const path     = require('path');
const multer   = require('multer');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// Parses multipart/form-data (the contact form is sent via FormData)
// without storing any files.
const upload = multer();

/* ---------- Contact form handler ---------- */
app.post('/api/contact', upload.none(), async (req, res) => {
  const field = (key) => {
    const val = req.body ? req.body[key] : undefined;
    if (val === undefined || val === null) return '';
    return String(val).replace(/[\r\n]/g, '').trim();
  };

  const firstName = field('firstName');
  const lastName  = field('lastName');
  const email     = field('email');
  const phone     = field('phone');
  const company   = field('company');
  const country   = field('country');
  const service   = field('service');
  const industry  = field('industry');
  const budget    = field('budget');
  const message   = (req.body && req.body.message ? String(req.body.message) : '').trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName)  errors.push('Last name is required.');
  if (!email || !emailRegex.test(email)) errors.push('A valid email address is required.');
  if (!country)  errors.push('Country is required.');
  if (!service)  errors.push('Please select a service of interest.');
  if (!message)  errors.push('Please describe your requirements.');
  if (!field('agreeTerms')) errors.push('You must agree to the Privacy Policy before submitting.');

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const subject = `New Enquiry — ${service} (${firstName} ${lastName})`;

  const body = [
    'New enquiry submitted via the Sky Shield Defence website contact form.',
    '',
    `Name:                    ${firstName} ${lastName}`,
    `Email:                   ${email}`,
    `Phone:                   ${phone   || '—'}`,
    `Company / Organisation:  ${company || '—'}`,
    `Country:                 ${country}`,
    `Service of Interest:     ${service}`,
    `Industry / Sector:       ${industry || '—'}`,
    `Approximate Budget:      ${budget   || '—'}`,
    '',
    'Requirements:',
    message,
  ].join('\n');

  const SMTP_USER = process.env.SMTP_USER || 'info@skyshielddefense.com';
  const MAIL_TO   = process.env.MAIL_TO   || 'info@skyshielddefense.com';

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS on port 587
      auth: {
        user: SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const messageDomain = SMTP_USER.split('@')[1] || 'skyshielddefense.com';

    await transporter.sendMail({
      from: `"Sky Shield Defence Website" <${SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: `"${firstName} ${lastName}" <${email}>`,
      subject,
      text: body,
      messageId: `<${Date.now()}.${Math.random().toString(36).slice(2)}@${messageDomain}>`,
      headers: {
        'X-Mailer': 'Sky Shield Defence Website Contact Form',
      },
    });

    res.json({
      success: true,
      message: 'Thank you — your request has been received. Our team will contact you shortly.',
    });
  } catch (err) {
    console.error('Mail send error:', err);
    res.status(500).json({
      success: false,
      message: 'Sorry, something went wrong. Please email us directly at info@skyshielddefense.com.',
    });
  }
});

/* ---------- Static site ---------- */
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sky Shield Defence running on port ${PORT}`);
});
