<?php
declare(strict_types=1);

namespace Jadmaa\Services;

/**
 * Transactional Email Service via Brevo (Sendinblue) REST API with mail() fallback.
 */
class EmailService
{
    private static function getApiKey(): ?string
    {
        return getenv('BREVO_API_KEY') ?: null;
    }

    private static function getSender(): array
    {
        return [
            'name' => getenv('BREVO_SENDER_NAME') ?: 'JADMAA VARMAKALAI',
            'email' => getenv('BREVO_SENDER_EMAIL') ?: 'info@jadmaa.com',
        ];
    }

    public static function sendTransactionalEmail(string $toEmail, string $subject, string $htmlContent): bool
    {
        $apiKey = self::getApiKey();

        if ($apiKey) {
            $sender = self::getSender();
            $payload = [
                'sender' => $sender,
                'to' => [['email' => $toEmail]],
                'subject' => $subject,
                'htmlContent' => $htmlContent,
            ];

            $ch = curl_init('https://api.brevo.com/v3/smtp/email');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'api-key: ' . $apiKey,
                'Content-Type: application/json',
                'Accept: application/json',
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                return true;
            }

            error_log("[EmailService] Brevo API error (code {$httpCode}): " . $response);
        }

        // Fallback to PHP native mail()
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: JADMAA VARMAKALAI <info@jadmaa.com>',
            'Reply-To: info@jadmaa.com',
            'X-Mailer: PHP/' . phpversion(),
        ];

        return @mail($toEmail, $subject, $htmlContent, implode("\r\n", $headers));
    }

    public static function sendPasswordResetEmail(string $email, string $resetUrl, string $name): bool
    {
        $subject = 'Reset your JADMAA password';
        $htmlContent = "
          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; color: #2B2521;\">
            <div style=\"text-align: center; margin-bottom: 24px;\">
              <h2 style=\"color: #B12B2B; margin-top: 0; font-weight: 800;\">JADMAA VARMAKALAI</h2>
              <p style=\"font-size: 14px; color: #666;\">Academy of Ancient Tamil Martial Science</p>
            </div>
            <p>Hello {$name},</p>
            <p>We received a request to reset your JADMAA account password.</p>
            <div style=\"text-align: center; margin: 24px 0;\">
              <a href=\"{$resetUrl}\" style=\"display: inline-block; padding: 12px 24px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;\">
                Reset Password
              </a>
            </div>
            <p>This link expires in 30 minutes.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <hr style=\"border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;\" />
            <p style=\"color: #666; font-size: 11px; text-align: center;\">JADMAA Varmakalai Training & Learning</p>
          </div>
        ";
        return self::sendTransactionalEmail($email, $subject, $htmlContent);
    }

    public static function sendCoursePurchaseAdminNotification(array $info): void
    {
        $adminEmail = getenv('ADMIN_NOTIFICATION_EMAIL') ?: 'admin@jadmaa.com';
        $subject = "New Course Enrollment: {$info['courseTitle']} ({$info['userName']})";
        $htmlContent = "
          <h2>New Course Enrollment</h2>
          <p><strong>Student:</strong> {$info['userName']} ({$info['userEmail']})</p>
          <p><strong>Course:</strong> {$info['courseTitle']}</p>
          <p><strong>Amount:</strong> ₹{$info['amount']}</p>
          <p><strong>Payment ID:</strong> {$info['paymentId']}</p>
          <p><strong>Order ID:</strong> {$info['orderId']}</p>
        ";
        self::sendTransactionalEmail($adminEmail, $subject, $htmlContent);
    }

    public static function sendProductOrderAdminNotification(array $info): void
    {
        $adminEmail = getenv('ADMIN_NOTIFICATION_EMAIL') ?: 'admin@jadmaa.com';
        $subject = "New Order #{$info['orderNumber']} Received (₹{$info['totalAmount']})";
        $htmlContent = "
          <h2>New Product Order Received</h2>
          <p><strong>Order Number:</strong> #{$info['orderNumber']}</p>
          <p><strong>Customer:</strong> {$info['userName']} ({$info['userEmail']} / {$info['userPhone']})</p>
          <p><strong>Shipping Address:</strong> {$info['deliveryAddress']}, Pincode: {$info['deliveryPincode']}</p>
          <p><strong>Total Amount:</strong> ₹{$info['totalAmount']}</p>
        ";
        self::sendTransactionalEmail($adminEmail, $subject, $htmlContent);
    }
}
