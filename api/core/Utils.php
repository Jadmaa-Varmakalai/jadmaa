<?php
declare(strict_types=1);

namespace Jadmaa\Core;

/**
 * Common Utility Functions
 */
class Utils
{
    /**
     * Generate standard RFC 4122 compliant UUID v4
     */
    public static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Generate URL-friendly slug
     */
    public static function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text) ?: $text;
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text ?: 'n-a');
    }

    /**
     * Parse and normalize date string to MySQL DATETIME format Y-m-d H:i:s
     */
    public static function toSqlDateTime(?string $dateStr): ?string
    {
        if (!$dateStr) {
            return null;
        }
        try {
            $dt = new \DateTime($dateStr);
            return $dt->format('Y-m-d H:i:s');
        } catch (\Exception) {
            return null;
        }
    }
}
