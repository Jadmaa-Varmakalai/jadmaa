<?php
declare(strict_types=1);

namespace Jadmaa\Config;

use PDO;
use PDOException;

/**
 * Database Singleton
 * Manages PDO connection to MySQL with UTF-8mb4 and transaction support.
 * Compatible with Hostinger Premium shared hosting (cPanel / hPanel MySQL).
 */
class Database
{
    private static ?Database $instance = null;
    private ?PDO $pdo = null;

    private function __construct()
    {
        $this->connect();
    }

    private function connect(): void
    {
        // Load .env if present
        self::loadEnv();

        $host = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: '127.0.0.1');
        $port = getenv('DB_PORT') ?: (getenv('MYSQL_PORT') ?: '3306');
        $dbname = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: 'jadmaa_db');
        $user = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: 'root');
        $password = getenv('DB_PASSWORD') ?: (getenv('MYSQL_PASSWORD') ?: '');

        // Also parse DATABASE_URL if standard URL format provided
        $dbUrl = getenv('DATABASE_URL');
        if ($dbUrl && str_starts_with($dbUrl, 'mysql://')) {
            $parsed = parse_url($dbUrl);
            if ($parsed) {
                $host = $parsed['host'] ?? $host;
                $port = (string)($parsed['port'] ?? $port);
                $user = $parsed['user'] ?? $user;
                $password = $parsed['pass'] ?? $password;
                $dbname = ltrim($parsed['path'] ?? '', '/') ?: $dbname;
            }
        }

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            // Fail gracefully with structured error message
            error_log('[Database Error] Connection failed: ' . $e->getMessage());
            throw new \RuntimeException('Database connection failed. Please verify credentials in configuration.');
        }
    }

    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        if ($this->pdo === null) {
            $this->connect();
        }
        return $this->pdo;
    }

    public static function getPdo(): PDO
    {
        return self::getInstance()->getConnection();
    }

    /**
     * Helper to load key=value from .env file into environment
     */
    public static function loadEnv(?string $filePath = null): void
    {
        if ($filePath === null) {
            $filePath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
        }

        if (!file_exists($filePath) || !is_readable($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $name = trim($parts[0]);
                $value = trim($parts[1]);

                // Remove surrounding quotes
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                if (!getenv($name)) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
}
