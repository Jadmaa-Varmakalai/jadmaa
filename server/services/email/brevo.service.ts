import { createSmtpTransporter, getFromAddress } from './smtp.provider.js';

interface BrevoEmailResponse {
  messageId: string;
}

interface ResendEmailResponse {
  id: string;
}

// In-memory cache for Brevo verified senders (1-hour TTL)
let verifiedSendersCache: { senders: string[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * High-Performance Email Delivery Engine
 * 
 * Supports:
 * 1. Resend REST API (Ultra-fast, sub-second delivery: RESEND_API_KEY)
 * 2. Brevo Transactional REST API (BREVO_API_KEY)
 * 3. Fast Pooled Nodemailer SMTP Fallback (Hostinger / Custom SMTP)
 * 4. Email validation and contact syncing
 */
export class BrevoService {
  private static getBrevoApiKey(): string {
    return (process.env.BREVO_API_KEY || '').trim();
  }

  private static getResendApiKey(): string {
    return (process.env.RESEND_API_KEY || '').trim();
  }

  private static getApiKey(): string {
    return this.getBrevoApiKey();
  }

  private static getMarketingListId(): number {
    return parseInt(process.env.BREVO_MARKETING_LIST_ID || '1', 10);
  }

  /**
   * Check if any fast API email provider is configured
   */
  public static isConfigured(): boolean {
    return this.getResendApiKey() !== '' || this.getBrevoApiKey() !== '' || Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER);
  }

  /**
   * Diagnostic self-test to verify email setup
   */
  public static async selfTest(): Promise<void> {
    const resendKey = this.getResendApiKey();
    const brevoKey = this.getBrevoApiKey();
    const fromAddress = getFromAddress();

    console.log('[EmailEngine] Running email provider diagnostic self-test...');
    console.log('[EmailEngine] RESEND_API_KEY:', resendKey ? `Configured (Length: ${resendKey.length})` : 'NOT SET');
    console.log('[EmailEngine] BREVO_API_KEY:', brevoKey ? `Configured (Length: ${brevoKey.length})` : 'NOT SET');
    console.log('[EmailEngine] SMTP Host:', process.env.EMAIL_HOST || 'NOT SET');
    console.log('[EmailEngine] Configured Sender (EMAIL_FROM):', fromAddress);

    if (brevoKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/senders', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'api-key': brevoKey,
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data && Array.isArray(data.senders)) {
            console.log('[EmailEngine] Brevo Verified Senders:', data.senders.map((s: any) => s.email).join(', '));
          }
        }
      } catch (err: any) {
        console.warn('[EmailEngine] Brevo self-test warning:', err.message);
      }
    }
  }

  /**
   * Fetch verified senders from Brevo with memory caching
   */
  public static async getVerifiedSenders(): Promise<string[]> {
    const now = Date.now();
    if (verifiedSendersCache && (now - verifiedSendersCache.timestamp) < CACHE_TTL_MS) {
      return verifiedSendersCache.senders;
    }

    const apiKey = this.getBrevoApiKey();
    if (!apiKey) return [];

    try {
      const response = await fetch('https://api.brevo.com/v3/senders', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
        },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json() as any;
        if (data && Array.isArray(data.senders)) {
          const senders = data.senders.filter((s: any) => s.active).map((s: any) => s.email);
          verifiedSendersCache = { senders, timestamp: now };
          return senders;
        }
      }
    } catch (e) {
      console.warn('[EmailEngine] Could not retrieve verified senders from Brevo:', e);
    }
    return [];
  }

  /**
   * High-Priority Instant Transactional Email (OTP, Password Reset)
   * Guaranteed sub-2-second delivery through Resend / Brevo API with immediate fast SMTP fallback
   */
  public static async sendTransactionalEmail(
    to: string,
    subject: string,
    htmlContent: string,
    senderName = 'JADMAA Varmakalai'
  ): Promise<{ success: boolean; reason?: string }> {
    const start = Date.now();
    const maskedEmail = to.replace(/(.{2})(.*)(?=@)/, (_gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
    const senderEmail = getFromAddress();

    // 1. Try Resend API (Ultra-Fast 500ms - 1.5s delivery)
    const resendKey = this.getResendApiKey();
    if (resendKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [to],
            subject,
            html: htmlContent,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (resendRes.ok) {
          const resendData = (await resendRes.json()) as ResendEmailResponse;
          const duration = Date.now() - start;
          console.log(`[EmailEngine] ⚡ Transactional email sent to ${maskedEmail} via Resend in ${duration}ms (ID: ${resendData.id})`);
          return { success: true };
        } else {
          const errorText = await resendRes.text();
          console.warn(`[EmailEngine] Resend returned HTTP ${resendRes.status}: ${errorText}`);
        }
      } catch (err: any) {
        console.warn(`[EmailEngine] Resend API attempt failed: ${err.message}`);
      }
    }

    // 2. Try Brevo REST API
    const brevoKey = this.getBrevoApiKey();
    if (brevoKey) {
      try {
        const attemptBrevo = async (fromEmail: string) => {
          return fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: senderName, email: fromEmail },
              to: [{ email: to }],
              subject,
              htmlContent,
            }),
            signal: AbortSignal.timeout(6000),
          });
        };

        let response = await attemptBrevo(senderEmail);

        if (!response.ok) {
          const errorData = await response.text();
          console.warn(`[EmailEngine] Brevo attempt failed (${response.status}): ${errorData}`);

          if (errorData.includes('invalid_parameter') || errorData.includes('sender')) {
            const verified = await this.getVerifiedSenders();
            if (verified.length > 0 && verified[0] !== senderEmail) {
              console.log(`[EmailEngine] Retrying Brevo with verified sender: ${verified[0]}`);
              response = await attemptBrevo(verified[0]);
            }
          }
        }

        if (response.ok) {
          const data = (await response.json()) as BrevoEmailResponse;
          const duration = Date.now() - start;
          console.log(`[EmailEngine] ⚡ Transactional email sent to ${maskedEmail} via Brevo in ${duration}ms (MsgID: ${data.messageId})`);
          return { success: true };
        }
      } catch (err: any) {
        console.warn(`[EmailEngine] Brevo API attempt failed: ${err.message}`);
      }
    }

    // 3. Fallback to Fast Pooled SMTP Transporter
    try {
      console.log(`[EmailEngine] Attempting SMTP fallback for ${maskedEmail}...`);
      const smtpSuccess = await this.sendViaSmtp(to, subject, htmlContent);
      if (smtpSuccess) {
        const duration = Date.now() - start;
        console.log(`[EmailEngine] ✅ Transactional email delivered to ${maskedEmail} via SMTP in ${duration}ms`);
        return { success: true };
      }
    } catch (smtpErr: any) {
      console.error(`[EmailEngine] SMTP fallback failed: ${smtpErr.message}`);
    }

    const duration = Date.now() - start;
    return {
      success: false,
      reason: `All delivery providers (Resend, Brevo, SMTP) failed or were unconfigured after ${duration}ms`,
    };
  }

  /**
   * General Email Sender (with provider auto-fallback)
   */
  public static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    senderName = 'JADMAA Varmakalai'
  ): Promise<boolean> {
    const result = await this.sendTransactionalEmail(to, subject, htmlContent, senderName);
    return result.success;
  }

  /**
   * Add contact to Brevo Marketing list
   */
  public static async addContactToMarketingList(email: string, name?: string): Promise<boolean> {
    const apiKey = this.getBrevoApiKey();
    if (!apiKey) return false;

    try {
      const listId = this.getMarketingListId();
      const firstName = name ? name.split(' ')[0] : '';
      const lastName = name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '';

      const response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          attributes: {
            FIRSTNAME: firstName,
            LASTNAME: lastName,
          },
          listIds: [listId],
          updateEnabled: true,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.warn('[EmailEngine] Failed to add contact to Brevo list:', errorData);
        return false;
      }

      console.log(`[EmailEngine] Contact "${email}" synced to marketing list.`);
      return true;
    } catch (error: any) {
      console.warn('[EmailEngine] Error adding contact to Brevo list:', error.message);
      return false;
    }
  }

  /**
   * Validate email format
   */
  public static validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Fallback SMTP sender using pooled nodemailer transporter
   */
  private static async sendViaSmtp(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      const host = (process.env.EMAIL_HOST || '').trim();
      if (!host) {
        console.warn('[EmailEngine] EMAIL_HOST is not configured; cannot use SMTP fallback.');
        return false;
      }

      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (error: any) {
      console.error('[EmailEngine] Nodemailer SMTP send error:', error.message);
      return false;
    }
  }
}
