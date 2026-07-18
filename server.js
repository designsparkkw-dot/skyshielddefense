const express     = require('express');
const path        = require('path');
const multer      = require('multer');
const nodemailer  = require('nodemailer');
const compression = require('compression');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

// Canonical host: 301-redirect non-www (and http) to https://www.
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  if (host === 'skyshielddefense.com' || (proto === 'http' && host.endsWith('skyshielddefense.com'))) {
    return res.redirect(301, `https://www.skyshielddefense.com${req.originalUrl}`);
  }
  next();
});

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

  const name     = f('name');
  const email    = f('email');
  const company  = f('company');
  const phone    = f('phone');
  const interest = f('interest');
  const source   = f('source');
  const message  = (req.body && req.body.message ? String(req.body.message) : '').trim();

  const errors = [];
  if (!name)  errors.push('Name is required.');
  if (!email || !emailRegex.test(email)) errors.push('A valid email address is required.');

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const subject = source
    ? `New Lead — ${source} (${name})`
    : `New Website Lead — ${name}`;
  const body = [
    source
      ? `A visitor submitted the lead form on the ${source} landing page.`
      : 'A visitor submitted the quick lead-capture popup on the Sky Shield Defense website.',
    '',
    `Name:                    ${name}`,
    `Email:                   ${email}`,
    `Company / Organisation:  ${company || '—'}`,
    `Phone:                   ${phone   || '—'}`,
    interest ? `Interested In:           ${interest}` : null,
    message  ? `\nProject Details:\n${message}` : null,
  ].filter(l => l !== null).join('\n');

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

/* ---------- Free rule-based FAQ chat assistant (no API key, no cost) ---------- */
const FAQ_RULES = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    reply: "Hello — I'm the Sky Shield Defense assistant. Ask me about our protective coatings, counter-drone systems, or security governance services, or about where we operate.",
  },
  {
    keywords: ['protect', 'coating', 'paint', 'polyurea', 'polyurethane', 'epoxy'],
    reply: "Sky Shield Protect delivers industrial protective coatings — polyurea, polyurethane and epoxy systems — for critical infrastructure. For a tailored assessment, please use our contact form.",
  },
  {
    keywords: ['drone', 'detect', 'intercept', 'counter-drone', 'counter drone', 'rf'],
    reply: "Sky Shield Detect & Intercept provides AI-powered counter-drone systems with detection and RF defeat/interception capabilities. Specific technical details require a confidential consultation — please reach out via our contact form.",
  },
  {
    keywords: ['secure', 'security governance', 'governance', 'physical security', 'cyber'],
    reply: "Sky Shield Secure delivers integrated security governance — combining physical, digital and personnel security — for governments and critical infrastructure operators.",
  },
  {
    keywords: ['price', 'cost', 'quote', 'pricing', 'how much', 'budget'],
    reply: "Pricing depends on the scope of your project, so we don't quote figures here. Please fill out our contact form for a free, tailored assessment — our team will follow up directly.",
  },
  {
    keywords: ['contact', 'phone', 'email', 'reach', 'call', 'talk to someone'],
    reply: "You can reach us at info@skyshielddefense.com or +1 (226) 289-9652, or fill out the contact form at /contact.html for a free assessment.",
  },
  {
    keywords: ['location', 'where', 'office', 'hq', 'headquarters', 'address', 'based'],
    reply: "Our USA HQ is at 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801. We currently deliver services exclusively across the MENA region and Africa, with a Kuwait Regional Hub for the Middle East.",
  },
  {
    keywords: ['experience', 'years', 'how long', 'about you', 'who are you', 'history'],
    reply: "Sky Shield Defense has 30+ years in the industry, with 2,000+ certified professionals operating across 6 continents and 80+ countries. Our tagline: \"Total Defense. Zero Compromise.\"",
  },
  {
    keywords: ['sector', 'industry', 'industries', 'who do you serve', 'clients'],
    reply: "We serve Government, Military, Airports & Aviation, Energy & Utilities, Oil & Gas, Maritime, Corrections, Finance & Corporate, Diplomatic/Embassies, Luxury Estates & VIPs, Healthcare & Research, and Construction & Infrastructure.",
  },
  {
    keywords: ['thank', 'thanks', 'appreciate'],
    reply: "You're welcome! Let me know if there's anything else you'd like to know, or visit /contact.html when you're ready for a free assessment.",
  },
  {
    keywords: ['bye', 'goodbye', 'see you'],
    reply: "Thanks for stopping by — feel free to reach out any time at info@skyshielddefense.com.",
  },
];

const FALLBACK_REPLY = "I'm not sure I can answer that directly — I can help with questions about our Protect, Detect & Intercept, and Secure services, our sectors, or how to get in touch. For anything else, please use our contact form at /contact.html and a specialist will follow up.";

function matchFaq(text) {
  const lower = text.toLowerCase();
  for (const rule of FAQ_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.reply;
    }
  }
  return FALLBACK_REPLY;
}

app.post('/api/chat', (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No message provided.' });
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user' && typeof m.content === 'string');
  if (!lastUserMessage || !lastUserMessage.content.trim()) {
    return res.status(400).json({ error: 'No valid message provided.' });
  }

  const reply = matchFaq(lastUserMessage.content.slice(0, 1000));
  res.json({ reply });
});

/* ---------- Static site ---------- */
app.use(express.static(path.join(__dirname), {
  maxAge: '1y',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    }
  },
}));

// Unknown paths return a real 404 (no soft-404 / directory-listing behaviour)
app.use((req, res) => {
  res.status(404).send(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 | Sky Shield Defense</title>' +
    '<meta name="robots" content="noindex"></head>' +
    '<body style="background:#060e1a;color:#f0f4f8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">' +
    '<div style="text-align:center;"><h1>404 — Page Not Found</h1>' +
    '<p><a href="/" style="color:#2472cc;">Return to skyshielddefense.com</a></p></div></body></html>'
  );
});

app.listen(PORT, () => {
  console.log(`Sky Shield Defense running on port ${PORT}`);
});
