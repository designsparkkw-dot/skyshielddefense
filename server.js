const express  = require('express');
const path     = require('path');
const multer   = require('multer');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// Parses multipart/form-data (forms are sent via FormData)
// without storing any files.
const upload = multer();

const SMTP_USER = process.env.SMTP_USER || 'info@skyshielddefense.com';
const MAIL_TO   = process.env.MAIL_TO   || 'info@skyshielddefense.com';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(req, key) {
  const val = req.body ? req.body[key] : undefined;
  if (val === undefined || val === null) return '';
  return String(val).replace(/[\r\n]/g, '').trim();
}

async function sendMail({ subject, body, replyName, replyEmail }) {
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
    from: `"Sky Shield Defense Website" <${SMTP_USER}>`,
    to: MAIL_TO,
    replyTo: `"${replyName}" <${replyEmail}>`,
    subject,
    text: body,
    messageId: `<${Date.now()}.${Math.random().toString(36).slice(2)}@${messageDomain}>`,
    headers: {
      'X-Mailer': 'Sky Shield Defense Website',
    },
  });
}

/* ---------- Main contact form handler ---------- */
app.post('/api/contact', upload.none(), async (req, res) => {
  const f = (key) => field(req, key);

  const firstName = f('firstName');
  const lastName  = f('lastName');
  const email     = f('email');
  const phone     = f('phone');
  const company   = f('company');
  const country   = f('country');
  const service   = f('service');
  const industry  = f('industry');
  const budget    = f('budget');
  const message   = (req.body && req.body.message ? String(req.body.message) : '').trim();

  const errors = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName)  errors.push('Last name is required.');
  if (!email || !emailRegex.test(email)) errors.push('A valid email address is required.');
  if (!phone)    errors.push('Phone number is required.');
  if (!company)  errors.push('Company / organisation is required.');
  if (!country)  errors.push('Country is required.');
  if (!service)  errors.push('Please select a service of interest.');
  if (!industry) errors.push('Please select your industry / sector.');
  if (!budget)   errors.push('Please select an approximate project budget.');
  if (!message)  errors.push('Please describe your requirements.');
  if (!f('agreeTerms')) errors.push('You must agree to the Privacy Policy before submitting.');

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const subject = `New Enquiry — ${service} (${firstName} ${lastName})`;
  const body = [
    'New enquiry submitted via the Sky Shield Defense website contact form.',
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

  try {
    await sendMail({ subject, body, replyName: `${firstName} ${lastName}`, replyEmail: email });
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

/* ---------- Quick lead-capture popup handler ---------- */
app.post('/api/lead', upload.none(), async (req, res) => {
  const f = (key) => field(req, key);

  const name    = f('name');
  const email   = f('email');
  const company = f('company');
  const phone   = f('phone');

  const errors = [];
  if (!name)  errors.push('Name is required.');
  if (!email || !emailRegex.test(email)) errors.push('A valid email address is required.');

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const subject = `New Website Lead — ${name}`;
  const body = [
    'A visitor submitted the quick lead-capture popup on the Sky Shield Defense website.',
    '',
    `Name:                    ${name}`,
    `Email:                   ${email}`,
    `Company / Organisation:  ${company || '—'}`,
    `Phone:                   ${phone   || '—'}`,
  ].join('\n');

  try {
    await sendMail({ subject, body, replyName: name, replyEmail: email });
    res.json({
      success: true,
      message: 'Thank you — our team will reach out shortly.',
    });
  } catch (err) {
    console.error('Lead mail send error:', err);
    res.status(500).json({
      success: false,
      message: 'Sorry, something went wrong. Please try again or email info@skyshielddefense.com.',
    });
  }
});

/* ---------- Static site ---------- */
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sky Shield Defense running on port ${PORT}`);
});
