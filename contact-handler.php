<?php
/**
 * Sky Shield Defence — Contact form mail handler
 *
 * Receives the contact form's POST data, validates/sanitises it, and
 * sends it to the company inbox using PHP's built-in mail() function.
 * On Hostinger shared hosting, mail() routes through the server's own
 * mail transfer agent for the hosted domain — no SMTP credentials are
 * required in this file.
 *
 * Returns a JSON response: { "success": true|false, "message": "..." }
 */

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// --- Where enquiries should land ---
$recipient = 'info@skyshielddefence.com';

// --- Helper: trim + sanitise a plain text field ---
function field($key) {
    if (!isset($_POST[$key])) return '';
    $value = trim((string) $_POST[$key]);
    // Strip anything that could be used for header injection
    $value = str_replace(["\r", "\n"], '', $value);
    return $value;
}

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

// --- Basic server-side validation ---
$errors = [];
if ($firstName === '') $errors[] = 'First name is required.';
if ($lastName === '')  $errors[] = 'Last name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
if ($country === '')   $errors[] = 'Country is required.';
if ($service === '')   $errors[] = 'Please select a service of interest.';
if (trim($message) === '') $errors[] = 'Please describe your requirements.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// --- Build the email ---
$subject = 'New Enquiry — ' . $service . ' (' . $firstName . ' ' . $lastName . ')';

$bodyLines = [
    'New enquiry submitted via the Sky Shield Defence website contact form.',
    '',
    'Name: ' . $firstName . ' ' . $lastName,
    'Email: ' . $email,
    'Phone: ' . ($phone !== '' ? $phone : '—'),
    'Company / Organisation: ' . ($company !== '' ? $company : '—'),
    'Country: ' . $country,
    'Service of Interest: ' . $service,
    'Industry / Sector: ' . ($industry !== '' ? $industry : '—'),
    'Approximate Project Budget: ' . ($budget !== '' ? $budget : '—'),
    '',
    'Requirements:',
    $message,
];
$body = implode("\n", $bodyLines);

// Reply-To is the visitor's own address so the team can respond directly
$headers = [];
$headers[] = 'From: Sky Shield Defence Website <info@skyshielddefence.com>';
$headers[] = 'Reply-To: ' . $firstName . ' ' . $lastName . ' <' . $email . '>';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = @mail($recipient, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you — your request has been received. Our team will contact you shortly.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, something went wrong sending your enquiry. Please email us directly at info@skyshielddefence.com.',
    ]);
}
