<?php
/**
 * Plugin Name: JADMAA Core Authentication & User Enumeration Defense
 * Description: Eliminates author scanning, restricts REST API user data, removes version fingerprints, and masks login errors.
 * Author: JADMAA Security Architecture
 * Version: 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// -----------------------------------------------------------------------------
// 1. BLOCK REST API USER ENUMERATION (/wp-json/wp/v2/users)
// -----------------------------------------------------------------------------
add_filter('rest_endpoints', function ($endpoints) {
    // Unset the user collection and individual user endpoints for unauthenticated requests
    if (!is_user_logged_in() || !current_user_can('list_users')) {
        if (isset($endpoints['/wp/v2/users'])) {
            unset($endpoints['/wp/v2/users']);
        }
        if (isset($endpoints['/wp/v2/users/(?P<id>[\d]+)'])) {
            unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
        }
    }
    return $endpoints;
});

// -----------------------------------------------------------------------------
// 2. BLOCK AUTHOR QUERY PARAMETERS & ARCHIVE SCANS (/?author=N)
// -----------------------------------------------------------------------------
add_action('template_redirect', function () {
    // Detect ?author=N scans or author template rendering
    if (is_author() || (isset($_GET['author']) && is_numeric($_GET['author']))) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        nocache_headers();
        include(get_query_template('404'));
        exit;
    }
});

// -----------------------------------------------------------------------------
// 3. REMOVE USER DATA FROM CORE XML SITEMAPS
// -----------------------------------------------------------------------------
add_filter('wp_sitemaps_add_provider', function ($provider, $name) {
    if ($name === 'users') {
        return false;
    }
    return $provider;
}, 10, 2);

// -----------------------------------------------------------------------------
// 4. MASK LOGIN ERROR MESSAGES (PREVENT USER VALIDATION VIA TIMING/ERRORS)
// -----------------------------------------------------------------------------
add_filter('login_errors', function () {
    // Always return a generic error so attackers cannot confirm if the username exists
    return '<strong>Error:</strong> Invalid login credentials entered.';
});

// -----------------------------------------------------------------------------
// 5. REMOVE WORDPRESS VERSION FINGERPRINTING & HEAD ARTIFACTS
// -----------------------------------------------------------------------------
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
add_filter('style_loader_src', 'jadmaa_remove_version_strings', 9999);
add_filter('script_loader_src', 'jadmaa_remove_version_strings', 9999);

function jadmaa_remove_version_strings($src) {
    if (strpos($src, 'ver=') !== false) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}
