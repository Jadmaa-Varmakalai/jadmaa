<?php
/**
 * JADMAA WordPress Security Hardening Block
 *
 * Place this block in your production wp-config.php directly above the line:
 * /* That's all, stop editing! Happy publishing. * /
 */

// =============================================================================
// 1. DASHBOARD CODE EXECUTION PREVENTION
// =============================================================================
// Completely disables the built-in theme and plugin file editor in the admin panel.
// Prevents attackers from uploading web-shells even if an admin session is hijacked.
define('DISALLOW_FILE_EDIT', true);

// =============================================================================
// 2. ENFORCE SSL FOR ADMINISTRATIVE SESSIONS
// =============================================================================
// Forces all administrative traffic, cookies, and login attempts over HTTPS.
define('FORCE_SSL_ADMIN', true);

// =============================================================================
// 3. ZERO PUBLIC ERROR & STACK TRACE REPORTING
// =============================================================================
// Prevents sensitive database paths, table prefixes, and query details from leaking.
define('WP_DEBUG', false);
define('WP_DEBUG_DISPLAY', false);
define('WP_DEBUG_LOG', false);
@ini_set('display_errors', '0');

// =============================================================================
// 4. DATABASE REPAIR RESTRICTION & TRASH PRUNING
// =============================================================================
// Prevents unauthenticated access to /wp-admin/maint/repair.php
define('WP_ALLOW_REPAIR', false);

// Limit deleted record retention to 14 days
define('EMPTY_TRASH_DAYS', 14);

// Enforce baseline memory limits
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
