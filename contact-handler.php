<?php
/**
 * Sky Shield Defence — Contact form mail handler (PHPMailer / SMTP)
 *
 * ─────────────────────────────────────────────────────────────────
 * SETUP — fill in the three lines below before going live:
 * ─────────────────────────────────────────────────────────────────
 * 1. SMTP_USER     → your full Hostinger mailbox address
 * 2. SMTP_PASS     → the password you set for that mailbox in hPanel
 * 3. MAIL_TO       → where enquiries should land (usually same address)
 *
 * After editing this file, SSH into Hostinger and run:
 *   cd ~/public_html && composer install --no-dev --optimize-autoloader
 *
 * Hostinger SMTP details (already set below — do not change):
 *   Host : smtp.hostinger.com   Port : 587   Encryption : STARTTLS
 * ─────────────────────────────────────────────────────────────────
 */

// ── CONFIGURE THESE THREE LINES ───────────────────────────────────
define('SMTP_USER', 'info@skyshielddefense.com');    // ← your mailbox address
define('SMTP_PASS', 'FILL_IN_YOUR_MAILBOX_PASSWORD'); // ← mailbox password (set in hPanel)
define('MAIL_TO',   'info@skyshielddefense.com');    // ← where to deliver enquiries
// ──────────────────────────────────────────────────────────────────

// Hostinger SMTP — do not change these
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);

// ── Load PHPMailer ─────────────────────────────────────────────────
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Mail library not installed. Please run: composer install',
    ]);
    exit;
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

// ── Only accept POST ───────────────────────────────────────────────
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Sanitise helper ───────────────────────────────────────────────
function field(string $key): string {
    if (!isset($_POST[$key])) return '';
    $value = trim((string) $_POST[$key]);
    return str_replace(["\r", "\n"], '', $value);
}

// ── Collect fields ────────────────────────────────────────────────
$firstName = field('firstName');
$lastName  = field('lastName');
$email     = field('email');
$phone     = field('phone');
$company   = field('company');
$country   = field('country');
$service   = field('service');
$industry  = field('industry');
$budget    = field('budget');
$message   = trim((string) ($_POST['message'] ?? ''));

// ── Validate ──────────────────────────────────────────────────────
$errors = [];
if ($firstName === '')                               $errors[] = 'First name is required.';
if ($lastName  === '')                               $errors[] = 'Last name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))
                                                     $errors[] = 'A valid email address is required.';
if ($country  === '')                                $errors[] = 'Country is required.';
if ($service  === '')                                $errors[] = 'Please select a service of interest.';
if ($message  === '')                                $errors[] = 'Please describe your requirements.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Build the email body ──────────────────────────────────────────
$subject = 'New Enquiry — ' . $service . ' (' . $firstName . ' ' . $lastName . ')';

$body = implode("\n", [
    'New enquiry submitted via the Sky Shield Defence website contact form.',
    '',
    'Name:                    ' . $firstName . ' ' . $lastName,
    'Email:                   ' . $email,
    'Phone:                   ' . ($phone    !== '' ? $phone    : '—'),
    'Company / Organisation:  ' . ($company  !== '' ? $company  : '—'),
    'Country:                 ' . $country,
    'Service of Interest:     ' . $service,
    'Industry / Sector:       ' . ($industry !== '' ? $industry : '—'),
    'Approximate Budget:      ' . ($budget   !== '' ? $budget   : '—'),
    '',
    'Requirements:',
    $message,
]);

// ── Send via PHPMailer / SMTP ─────────────────────────────────────
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(SMTP_USER, 'Sky Shield Defence Website');
    $mail->addAddress(MAIL_TO, 'Sky Shield Defence');
    $mail->addReplyTo($email, $firstName . ' ' . $lastName);

    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Thank you — your request has been received. Our team will contact you shortly.',
    ]);

} catch (MailerException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, something went wrong sending your enquiry. Please email us directly at info@skyshielddefense.com.',
    ]);
}
