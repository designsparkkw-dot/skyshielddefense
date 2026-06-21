const express  = require('express');
const path     = require('path');
const multer   = require('multer');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20kb' }));

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

/* ---------- AI chat assistant ---------- */
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const CHAT_SYSTEM_PROMPT = `You are the website chat assistant for Sky Shield Defense, a global security company. Your job is to answer visitor questions helpfully and concisely, and to encourage promising enquiries to use the contact form.

COMPANY FACTS (only state what's listed here — never invent details, pricing, certifications, or claims not provided):
- Tagline: "Total Defense. Zero Compromise."
- 30+ years in the industry, 2,000+ certified global professionals, operations across 6 continents, active in 80+ countries.
- Three capability pillars:
  1. Protect — industrial protective coatings (polyurea, polyurethane, epoxy systems) for critical infrastructure.
  2. Detect & Intercept — AI-powered counter-drone systems with detection and RF defeat/interception capabilities.
  3. Secure — integrated security governance combining physical, digital, and personnel security.
- Sectors served: Government, Military, Airports & Aviation, Energy & Utilities, Oil & Gas, Maritime, Corrections, Finance & Corporate, Diplomatic/Embassies, Luxury Estates & VIPs, Healthcare & Research, Construction & Infrastructure.
- Currently delivers services exclusively across the MENA region and Africa, with a Kuwait Regional Hub for the Middle East.
- USA HQ: 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801.
- Contact: info@skyshielddefense.com, +1 (226) 289-9652. Contact form: /contact.html

RULES:
- Keep answers short (2-4 sentences) — this is a small website chat widget, not a long-form assistant.
- Never give specific pricing, contract terms, or technical/operational security details (e.g. exact counter-drone frequencies, defeat mechanisms) — these require a confidential consultation. Direct those questions to the contact form.
- Never discuss unrelated topics (general tech support, personal advice, other companies, world events). Politely redirect to how Sky Shield Defense can help.
- If a visitor seems to have a real project or enquiry, encourage them to fill out the contact form at /contact.html for a free assessment.
- Be professional and discreet, matching a serious government/defense-sector audience.`;

// Minimal per-IP rate limit to control API cost exposure from abuse.
const chatRateLimit = new Map(); // ip -> { count, windowStart }
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = chatRateLimit.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    chatRateLimit.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

app.post('/api/chat', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'Chat assistant is not configured yet.' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages — please try again in a few minutes.' });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No message provided.' });
  }

  const cleanMessages = messages
    .slice(-10) // cap conversation history sent per request
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

  if (cleanMessages.length === 0) {
    return res.status(400).json({ error: 'No valid message provided.' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: CHAT_SYSTEM_PROMPT,
      messages: cleanMessages,
    });

    const reply = response.content.find(b => b.type === 'text')?.text
      || "Sorry, I couldn't generate a response — please try again or use the contact form.";

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Sorry, the assistant is temporarily unavailable. Please try the contact form instead.' });
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
