<?php
/**
 * The base configuration for WordPress on JADMAA.com
 * Hardened for production deployment.
 */

// ** Database settings - Configured via environment variables or host defaults ** //
define('DB_NAME', getenv('WORDPRESS_DB_NAME') ?: 'jadmaa_wp');
define('DB_USER', getenv('WORDPRESS_DB_USER') ?: 'jadmaa_user');
define('DB_PASSWORD', getenv('WORDPRESS_DB_PASSWORD') ?: '');
define('DB_HOST', getenv('WORDPRESS_DB_HOST') ?: 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

/**#@+
 * Authentication unique keys and salts.
 * Replace these with unique phrases generated from: https://api.wordpress.org/secret-key/1.1/salt/
 */
define('AUTH_KEY',         getenv('WP_AUTH_KEY')         ?: 'put your unique phrase here');
define('SECURE_AUTH_KEY',  getenv('WP_SECURE_AUTH_KEY')  ?: 'put your unique phrase here');
define('LOGGED_IN_KEY',    getenv('WP_LOGGED_IN_KEY')    ?: 'put your unique phrase here');
define('NONCE_KEY',        getenv('WP_NONCE_KEY')        ?: 'put your unique phrase here');
define('AUTH_SALT',        getenv('WP_AUTH_SALT')        ?: 'put your unique phrase here');
define('SECURE_AUTH_SALT', getenv('WP_SECURE_AUTH_SALT') ?: 'put your unique phrase here');
define('LOGGED_IN_SALT',   getenv('WP_LOGGED_IN_SALT')   ?: 'put your unique phrase here');
define('NONCE_SALT',       getenv('WP_NONCE_SALT')       ?: 'put your unique phrase here');
/**#@-*/

/**
 * WordPress database table prefix.
 */
$table_prefix = 'jdm_';

// =============================================================================
// JADMAA PRODUCTION SECURITY HARDENING INJECTIONS
// =============================================================================

// 1. Disable in-dashboard theme & plugin code editor
define('DISALLOW_FILE_EDIT', true);

// 2. Force SSL across all administrative and login operations
define('FORCE_SSL_ADMIN', true);

// 3. Disable Public Error & Stack Trace Reporting
define('WP_DEBUG', false);
define('WP_DEBUG_DISPLAY', false);
define('WP_DEBUG_LOG', false);
@ini_set('display_errors', '0');

// 4. Disable Automatic Database Repair script access
define('WP_ALLOW_REPAIR', false);

// 5. Shorten trash retention to reduce orphaned sensitive records
define('EMPTY_TRASH_DAYS', 14);

// 6. Memory allocations
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

/** Sets up WordPress vars and included files. */
if (file_exists(ABSPATH . 'wp-settings.php')) {
    require_once ABSPATH . 'wp-settings.php';
}
