<?php
/**
 * Sky Shield Defence — Contact form mail handler
 * Uses PHP mail() routed through Hostinger's MTA.
 * No Composer or external libraries required.
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

define('MAIL_TO', 'info@skyshielddefense.com');

function field(string $key): string {
    if (!isset($_POST[$key])) return '';
    return str_replace(["\r", "\n"], '', trim((string) $_POST[$key]));
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

$errors = [];
if ($firstName === '')  $errors[] = 'First name is required.';
if ($lastName  === '')  $errors[] = 'Last name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))
                        $errors[] = 'A valid email address is required.';
if ($country  === '')   $errors[] = 'Country is required.';
if ($service  === '')   $errors[] = 'Please select a service of interest.';
if ($message  === '')   $errors[] = 'Please describe your requirements.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

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

$headers = implode("\r\n", [
    'From: Sky Shield Defence Website <info@skyshielddefense.com>',
    'Reply-To: ' . $firstName . ' ' . $lastName . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sent = @mail(MAIL_TO, $subject, $body, $headers);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you — your request has been received. Our team will contact you shortly.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, something went wrong. Please email us directly at info@skyshielddefense.com.',
    ]);
}
