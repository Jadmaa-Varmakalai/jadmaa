<?php
/**
 * Plugin Name: JADMAA Origin Login Rate Limiter & Brute-Force Lockout
 * Description: Native IP rate-limiting blocking IPs after 4 failed attempts for 15 minutes and throttling password resets.
 * Author: JADMAA Security Architecture
 * Version: 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('JADMAA_MAX_LOGIN_ATTEMPTS', 4);
define('JADMAA_LOCKOUT_DURATION', 900); // 15 minutes in seconds

// Helper: Extract origin client IP strictly from remote address
function jadmaa_get_client_ip() {
    return sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

// -----------------------------------------------------------------------------
// 1. CHECK IP LOCKOUT PRIOR TO AUTHENTICATION EXECUTION
// -----------------------------------------------------------------------------
add_action('wp_authenticate', function ($username) {
    $ip = jadmaa_get_client_ip();
    $lockout_key = 'jadmaa_lock_' . md5($ip);

    if (get_transient($lockout_key)) {
        wp_die(
            '<div style="max-width:550px;margin:50px auto;font-family:sans-serif;padding:30px;border:1px solid #E8DDD0;border-radius:12px;background:#FAF6F0;color:#2B2521;">'
            . '<h2 style="color:#B12B2B;margin-top:0;">Access Restricted</h2>'
            . '<p>Too many failed login attempts detected from your IP address (' . esc_html($ip) . ').</p>'
            . '<p>Your access has been temporarily locked out for <strong>15 minutes</strong> to protect academy accounts. Please retry later.</p>'
            . '<p style="font-size:12px;color:#5C5148;margin-bottom:0;">JADMAA Security Shield • Error Code: 429</p>'
            . '</div>',
            'HTTP 429 Too Many Requests',
            ['response' => 429]
        );
    }
}, 1);

// -----------------------------------------------------------------------------
// 2. INCREMENT COUNTER ON FAILED LOGIN ATTEMPT
// -----------------------------------------------------------------------------
add_action('wp_login_failed', function ($username) {
    $ip = jadmaa_get_client_ip();
    $attempts_key = 'jadmaa_attempts_' . md5($ip);
    $lockout_key = 'jadmaa_lock_' . md5($ip);

    $attempts = (int) get_transient($attempts_key);
    $attempts++;

    if ($attempts >= JADMAA_MAX_LOGIN_ATTEMPTS) {
        // Enforce 15-minute lockout
        set_transient($lockout_key, true, JADMAA_LOCKOUT_DURATION);
        delete_transient($attempts_key);
    } else {
        // Track attempts within window
        set_transient($attempts_key, $attempts, JADMAA_LOCKOUT_DURATION);
    }
});

// -----------------------------------------------------------------------------
// 3. CLEAR ATTEMPTS COUNTER UPON SUCCESSFUL LOGIN
// -----------------------------------------------------------------------------
add_action('wp_login', function ($username) {
    $ip = jadmaa_get_client_ip();
    delete_transient('jadmaa_attempts_' . md5($ip));
});

// -----------------------------------------------------------------------------
// 4. RATE-LIMIT PASSWORD RESET REQUEST FLOODING (1 per 10 minutes per IP)
// -----------------------------------------------------------------------------
add_action('lostpassword_post', function () {
    $ip = jadmaa_get_client_ip();
    $reset_key = 'jadmaa_pwd_reset_' . md5($ip);

    if (get_transient($reset_key)) {
        wp_die(
            '<div style="max-width:550px;margin:50px auto;font-family:sans-serif;padding:30px;border:1px solid #E8DDD0;border-radius:12px;background:#FAF6F0;color:#2B2521;">'
            . '<h2 style="color:#B12B2B;margin-top:0;">Password Reset Rate Limit</h2>'
            . '<p>A password reset request was recently initiated from this network.</p>'
            . '<p>To prevent inbox flooding, password resets are restricted to once every 10 minutes per IP address.</p>'
            . '</div>',
            'HTTP 429 Too Many Requests',
            ['response' => 429]
        );
    }

    // Set 10-minute lockout on subsequent reset requests
    set_transient($reset_key, true, 600);
});
