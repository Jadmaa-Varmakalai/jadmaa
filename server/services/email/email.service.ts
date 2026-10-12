import { BrevoService } from './brevo.service.js';
import { prisma } from '../../db.js';

export const sendPasswordResetEmail = async (email: string, resetUrl: string, name: string): Promise<{success: boolean, reason?: string}> => {
  try {
    const subject = 'Reset your JADMAA password';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; color: #2B2521;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #B12B2B; margin-top: 0; font-weight: 800;">JADMAA VARMAKALAI</h2>
          <p style="font-size: 14px; color: #666;">Academy of Ancient Tamil Martial Science</p>
        </div>
        <p>Hello ${name},</p>
        <p>We received a request to reset your JADMAA account password.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #666; font-size: 11px; text-align: center;">JADMAA Varmakalai Training & Learning</p>
      </div>
    `;

    const result = await BrevoService.sendTransactionalEmail(email, subject, htmlContent);
    return result;
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, reason: error.message };
  }
};

export const sendPasswordChangedEmail = async (email: string, name: string) => {
  try {
    const subject = 'Your JADMAA password was changed';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; color: #2B2521;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #B12B2B; margin-top: 0; font-weight: 800;">JADMAA VARMAKALAI</h2>
          <p style="font-size: 14px; color: #666;">Academy of Ancient Tamil Martial Science</p>
        </div>
        <p>Hello ${name},</p>
        <p>Your JADMAA account password was successfully changed.</p>
        <p>If you did not make this change, please contact JADMAA support immediately at info@jadmaa.com.</p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #666; font-size: 11px; text-align: center;">JADMAA Varmakalai Training & Learning</p>
      </div>
    `;

    const success = await BrevoService.sendEmail(email, subject, htmlContent);
    if (!success) {
      console.warn(`[EmailService] Password changed email for "${name}" (${email}) could not be sent due to Brevo configuration / IP lock.`);
    }
  } catch (error) {
    console.error('Error sending password changed email:', error);
  }
};

/**
 * Suggest a newly added/published course to all active students
 */
export const sendNewCourseSuggestionEmail = async (courseId: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    });

    if (!course) {
      console.warn(`[EmailService] Course with id ${courseId} not found. Skipping suggestion emails.`);
      return;
    }

    // Find all active students to send course suggestion email
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { email: true, name: true }
    });

    if (students.length === 0) {
      console.info('[EmailService] No active students found to send suggestion email.');
      return;
    }

    console.log(`[EmailService] Sending suggestion emails for course "${course.title}" to ${students.length} students...`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const courseUrl = `${frontendUrl}/courses/${course.slug}`;

    for (const student of students) {
      const subject = `🔥 New Varmakalai Course Available: ${course.title}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; color: #2B2521;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #B12B2B; margin-top: 0; font-weight: 800;">JADMAA VARMAKALAI</h2>
            <p style="font-size: 14px; color: #666;">Academy of Ancient Tamil Martial Science</p>
          </div>
          
          <p>Hello <strong>${student.name}</strong>,</p>
          <p>We are thrilled to announce the launch of our newest professional Varmakalai program!</p>
          
          <div style="background-color: #FAF6F0; border-left: 4px solid #B12B2B; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #2B2521;">${course.title}</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #4A4A4A;">${course.subtitle || course.description}</p>
            <p style="font-size: 14px; margin-bottom: 0; color: #4A4A4A;">
              <strong>Instructor:</strong> ${course.instructor?.displayName || 'Grandmaster'}<br />
              <strong>Level:</strong> ${course.level}<br />
              <strong>Duration:</strong> ${course.duration || 'Flexible'}
            </p>
          </div>
          
          <p>Learn authentic Varmakalai defensive tactics and health science from our certified Grandmasters directly online.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${courseUrl}" style="display: inline-block; padding: 12px 28px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(177, 43, 43, 0.15);">
              Explore Course Syllabus
            </a>
          </div>
          
          <p style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            You received this recommendation as a registered student of JADMAA Varmakalai Academy.<br />
            <a href="${frontendUrl}/dashboard" style="color: #B12B2B;">Manage Email Preferences</a>
          </p>
        </div>
      `;

      // Send the email (runs asynchronously in background)
      BrevoService.sendEmail(student.email, subject, htmlContent).catch(err => {
        console.error(`[EmailService] Failed to send course recommendation to ${student.email}:`, err);
      });
    }
  } catch (error) {
    console.error('[EmailService] Error in sendNewCourseSuggestionEmail:', error);
  }
};

export interface CoursePurchaseNotificationParams {
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseId: string;
  amount: number;
  currency?: string;
  paymentId: string;
  orderId: string;
}

/**
 * Notifies administrators whenever a student purchases a course.
 */
export const sendCoursePurchaseAdminNotificationEmail = async (
  params: CoursePurchaseNotificationParams
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const { userName, userEmail, courseTitle, amount, currency = 'INR', paymentId, orderId } = params;

    // Collect recipient admin emails
    const adminEmails: Set<string> = new Set();

    // 1. Check ADMIN_NOTIFICATION_EMAIL or ADMIN_EMAIL in environment variables
    const envAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    if (envAdmin) {
      envAdmin.split(',').forEach((e) => {
        const trimmed = e.trim();
        if (trimmed) adminEmails.add(trimmed);
      });
    }

    // 2. Query users with ADMIN or SUPER_ADMIN role in database
    try {
      const dbAdmins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true,
        },
        select: { email: true },
      });
      dbAdmins.forEach((admin) => {
        if (admin.email) adminEmails.add(admin.email.trim());
      });
    } catch (dbErr) {
      console.warn('[EmailService] Could not fetch admin users from DB:', dbErr);
    }

    // Fallback if no admin email found
    if (adminEmails.size === 0) {
      adminEmails.add('info@jadmaa.com');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://jadmaa.com';
    const formattedAmount = `${currency} ${amount.toLocaleString('en-IN')}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const subject = `🔔 New Course Purchase: ${userName} bought "${courseTitle}"`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; color: #2B2521;">
        <div style="background-color: #B12B2B; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">JADMAA VARMAKALAI</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">New Course Purchase Alert</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0; line-height: 1.5;">
            Student <strong>${userName}</strong> has just purchased and unlocked <strong>${courseTitle}</strong>.
          </p>

          <div style="background-color: #FBF8F5; border: 1px solid #EFE8E0; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #666; width: 140px;"><strong>Student Name:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Student Email:</strong></td>
                <td style="padding: 6px 0; color: #111;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Course:</strong></td>
                <td style="padding: 6px 0; color: #B12B2B; font-weight: 600;">${courseTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Amount Paid:</strong></td>
                <td style="padding: 6px 0; color: #228B22; font-weight: bold; font-size: 15px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Payment Gateway:</strong></td>
                <td style="padding: 6px 0; color: #111;">Razorpay</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Payment ID:</strong></td>
                <td style="padding: 6px 0; color: #444; font-family: monospace;">${paymentId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Order ID:</strong></td>
                <td style="padding: 6px 0; color: #444; font-family: monospace;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Date & Time (IST):</strong></td>
                <td style="padding: 6px 0; color: #111;">${timestamp}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${frontendUrl}/admin" style="display: inline-block; padding: 12px 26px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              Open Admin Dashboard
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            This is an automated administrative alert from the JADMAA payment system.
          </p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending course purchase alert to admins: ${Array.from(adminEmails).join(', ')}`);

    adminEmails.forEach((adminEmail) => {
      BrevoService.sendTransactionalEmail(adminEmail, subject, htmlContent).catch((err) => {
        console.error(`[EmailService] Error sending purchase alert to admin ${adminEmail}:`, err);
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending course purchase admin notification:', error);
    return { success: false, reason: error.message };
  }
};

