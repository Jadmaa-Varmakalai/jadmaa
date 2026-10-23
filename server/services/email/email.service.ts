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

export interface EnquiryNotificationParams {
  name: string;
  phone: string;
  email?: string;
  category: 'CLASS' | 'TREATMENT';
  type: 'ONLINE_CLASS' | 'OFFLINE_CLASS' | 'VARMA_TREATMENT';
  typeLabel: string;
  courseTitle?: string;
  location?: string;
  message?: string;
}

/**
 * Notifies administrators whenever a user submits a contact/enquiry form.
 */
export const sendEnquiryAdminNotificationEmail = async (
  params: EnquiryNotificationParams
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const { name, phone, email, category, typeLabel, courseTitle, location, message } = params;

    // Collect recipient admin emails
    const adminEmails: Set<string> = new Set();

    const envAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    if (envAdmin) {
      envAdmin.split(',').forEach((e) => {
        const trimmed = e.trim();
        if (trimmed) adminEmails.add(trimmed);
      });
    }

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

    if (adminEmails.size === 0) {
      adminEmails.add('info@jadmaa.com');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://jadmaa.com';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const badgeColor = category === 'TREATMENT' ? '#0E7490' : '#B12B2B';
    const categoryTitle = category === 'TREATMENT' ? 'Varma Treatment Enquiry' : 'Class / Training Enquiry';

    const subject = `📩 New ${categoryTitle}: ${name} (${typeLabel})`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; color: #2B2521;">
        <div style="background-color: ${badgeColor}; padding: 22px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">JADMAA VARMAKALAI</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">New Website Enquiry Received</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0; line-height: 1.5;">
            A new enquiry has been submitted on the JADMAA website.
          </p>

          <div style="background-color: #FBF8F5; border: 1px solid #EFE8E0; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #666; width: 140px;"><strong>Name:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Phone / WhatsApp:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">
                  <a href="tel:${phone}" style="color: #2B2521; text-decoration: none;">${phone}</a>
                  &nbsp;
                  <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #25D366; font-size: 12px; font-weight: bold; text-decoration: underline;">(Chat on WhatsApp)</a>
                </td>
              </tr>
              ${email ? `
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 6px 0; color: #111;"><a href="mailto:${email}" style="color: #B12B2B;">${email}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Enquiry Type:</strong></td>
                <td style="padding: 6px 0; color: ${badgeColor}; font-weight: 600;">${typeLabel}</td>
              </tr>
              ${courseTitle ? `
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Selected Course:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">${courseTitle}</td>
              </tr>
              ` : ''}
              ${location ? `
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Preferred Location:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">📍 ${location}</td>
              </tr>
              ` : ''}
              ${message ? `
              <tr>
                <td style="padding: 6px 0; color: #666; vertical-align: top;"><strong>Message:</strong></td>
                <td style="padding: 6px 0; color: #333; line-height: 1.5;">${message}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Submitted At (IST):</strong></td>
                <td style="padding: 6px 0; color: #111;">${timestamp}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 26px 0 14px 0;">
            <a href="${frontendUrl}/admin#enquiries" style="display: inline-block; padding: 12px 26px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              View Enquiries in Admin Portal
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            This is an automated administrative alert from JADMAA Varmakalai website.
          </p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending enquiry alert to admins: ${Array.from(adminEmails).join(', ')}`);

    adminEmails.forEach((adminEmail) => {
      BrevoService.sendTransactionalEmail(adminEmail, subject, htmlContent).catch((err) => {
        console.error(`[EmailService] Error sending enquiry alert to admin ${adminEmail}:`, err);
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending enquiry admin notification:', error);
    return { success: false, reason: error.message };
  }
};

export interface EnquiryUserAcknowledgementParams {
  name: string;
  email: string;
  phone?: string;
  typeLabel: string;
  courseTitle?: string;
  location?: string;
}

export const sendEnquiryUserAcknowledgementEmail = async (
  params: EnquiryUserAcknowledgementParams
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const { name, email, phone, typeLabel, courseTitle, location } = params;
    if (!email || !email.includes('@')) {
      return { success: false, reason: 'No valid recipient email' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://jadmaa.com';
    const subject = `✨ Thank you for contacting JADMAA Varmakalai: ${typeLabel}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; color: #2B2521;">
        <div style="background-color: #B12B2B; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">JADMAA VARMAKALAI</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Academy of Ancient Tamil Martial Science</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0; line-height: 1.5;">
            Dear <strong>${name}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A;">
            Thank you for reaching out to JADMAA Varmakalai. We have successfully received your enquiry regarding <strong>${typeLabel}</strong>.
          </p>

          <div style="background-color: #FBF8F5; border: 1px solid #EFE8E0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #B12B2B;">YOUR ENQUIRY SUMMARY:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #666; width: 130px;"><strong>Interest:</strong></td>
                <td style="padding: 4px 0; color: #111; font-weight: 600;">${typeLabel}</td>
              </tr>
              ${courseTitle ? `
              <tr>
                <td style="padding: 4px 0; color: #666;"><strong>Course:</strong></td>
                <td style="padding: 4px 0; color: #111;">${courseTitle}</td>
              </tr>
              ` : ''}
              ${location ? `
              <tr>
                <td style="padding: 4px 0; color: #666;"><strong>Branch / City:</strong></td>
                <td style="padding: 4px 0; color: #111;">📍 ${location}</td>
              </tr>
              ` : ''}
              ${phone ? `
              <tr>
                <td style="padding: 4px 0; color: #666;"><strong>Contact Phone:</strong></td>
                <td style="padding: 4px 0; color: #111;">${phone}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A;">
            Our admissions team and senior instructors will review your details and reach out to you directly via phone or WhatsApp shortly.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A;">
            If you need urgent assistance or wish to book a direct consultation, you may also reach our academy desk directly at:
            <br />
            📞 <strong><a href="tel:+919345220020" style="color: #B12B2B; text-decoration: none;">+91 93452 20020</a></strong>
            &nbsp;|&nbsp;
            💬 <strong><a href="https://wa.me/919345220020" style="color: #25D366; text-decoration: none;">WhatsApp Us</a></strong>
          </p>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${frontendUrl}/courses" style="display: inline-block; padding: 12px 26px; background-color: #2B2521; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              Explore All Varmakalai Courses
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            JADMAA Varmakalai Academy & Varma Clinic — Thanjavur • Kumbakonam • Ariyalur<br />
            <a href="${frontendUrl}" style="color: #B12B2B; text-decoration: none;">www.jadmaa.com</a>
          </p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending enquiry confirmation to customer: ${email}`);
    await BrevoService.sendTransactionalEmail(email, subject, htmlContent);
    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending enquiry acknowledgement to customer:', error);
    return { success: false, reason: error.message };
  }
};

export interface ProductOrderItemSummary {
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  sku?: string;
  image?: string | null;
}

export interface ProductOrderNotificationParams {
  orderNumber: string;
  orderId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  deliveryAddress: string;
  deliveryPincode: string;
  items: ProductOrderItemSummary[];
  subtotal: number;
  shippingCharge: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentId?: string;
}

/**
 * Notifies administrators whenever a user places a product order.
 * Contains user's name, email address, phone number, delivery address,
 * product name(s), price, and quantity ordered.
 */
export const sendProductOrderAdminNotificationEmail = async (
  params: ProductOrderNotificationParams
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const {
      orderNumber,
      orderId,
      userName,
      userEmail,
      userPhone,
      deliveryAddress,
      deliveryPincode,
      items,
      subtotal,
      shippingCharge,
      totalAmount,
      paymentMethod = 'RAZORPAY',
      paymentId = '',
    } = params;

    // Collect recipient admin emails
    const adminEmails: Set<string> = new Set();

    const envAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    if (envAdmin) {
      envAdmin.split(',').forEach((e) => {
        const trimmed = e.trim();
        if (trimmed) adminEmails.add(trimmed);
      });
    }

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

    if (adminEmails.size === 0) {
      adminEmails.add('info@jadmaa.com');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://jadmaa.com';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const cleanPhone = (userPhone || '').replace(/[^0-9]/g, '');

    // Render table rows for ordered items
    const itemsRowsHtml = items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 8px; vertical-align: middle;">
          <div style="font-weight: 600; color: #111; font-size: 13px;">${item.productName}</div>
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; color: #444; font-size: 13px; text-align: right; white-space: nowrap;">
          ₹${item.unitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; font-weight: bold; color: #B12B2B; font-size: 13px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; font-weight: bold; color: #111; font-size: 13px; text-align: right; white-space: nowrap;">
          ₹${item.lineTotal.toLocaleString('en-IN')}
        </td>
      </tr>
    `
      )
      .join('');

    const productSummary =
      items.length === 1
        ? `${items[0].productName} (Qty: ${items[0].quantity})`
        : `${items[0].productName} + ${items.length - 1} more item(s)`;

    const subject = `📦 New Product Order #${orderNumber}: ${userName} ordered ${productSummary}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; color: #2B2521; background-color: #ffffff;">
        <div style="background-color: #B12B2B; padding: 22px 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">JADMAA VARMAKALAI</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">New Store Product Order Alert</p>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #166534; font-weight: bold;">
              🎉 Order #${orderNumber} Confirmed & Paid
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803D;">
              Payment received via ${paymentMethod}${paymentId ? ` (Transaction ID: ${paymentId})` : ''} on ${timestamp}.
            </p>
          </div>

          <!-- Customer & Delivery Details -->
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #B12B2B; text-transform: uppercase; letter-spacing: 0.5px;">
            Customer & Delivery Information
          </h3>
          <div style="background-color: #FBF8F5; border: 1px solid #EFE8E0; border-radius: 6px; padding: 16px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #666; width: 140px;"><strong>Customer Name:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Email Address:</strong></td>
                <td style="padding: 6px 0; color: #111;">
                  <a href="mailto:${userEmail}" style="color: #B12B2B; text-decoration: none; font-weight: 600;">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;"><strong>Phone Number:</strong></td>
                <td style="padding: 6px 0; color: #111; font-weight: 600;">
                  <a href="tel:${userPhone}" style="color: #2B2521; text-decoration: none;">${userPhone}</a>
                  ${
                    cleanPhone
                      ? `&nbsp;&nbsp;<a href="https://wa.me/${cleanPhone}" target="_blank" style="color: #25D366; font-size: 12px; font-weight: bold; text-decoration: underline;">(Chat on WhatsApp)</a>`
                      : ''
                  }
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; vertical-align: top;"><strong>Delivery Address:</strong></td>
                <td style="padding: 6px 0; color: #111; line-height: 1.5; font-weight: 600;">
                  ${deliveryAddress}
                  ${deliveryPincode ? `<br /><span style="color: #666; font-weight: normal;">Pincode: </span><strong>${deliveryPincode}</strong>` : ''}
                </td>
              </tr>
            </table>
          </div>

          <!-- Products Ordered Table -->
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #B12B2B; text-transform: uppercase; letter-spacing: 0.5px;">
            Products Ordered
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #FAF6F0; border-bottom: 2px solid #EFE8E0; color: #666; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 10px 8px; text-align: left;">Product Name</th>
                <th style="padding: 10px 8px; text-align: right;">Unit Price</th>
                <th style="padding: 10px 8px; text-align: center;">Qty</th>
                <th style="padding: 10px 8px; text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; color: #666; font-size: 12px;">Subtotal:</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; color: #333; font-size: 13px;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 4px 8px; text-align: right; color: #666; font-size: 12px;">Delivery Shipping:</td>
                <td style="padding: 4px 8px; text-align: right; font-weight: 600; color: ${shippingCharge === 0 ? '#166534' : '#333'}; font-size: 13px;">
                  ${shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}
                </td>
              </tr>
              <tr style="border-top: 2px solid #EFE8E0;">
                <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #2B2521; font-size: 14px;">Total Amount Paid:</td>
                <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #B12B2B; font-size: 16px;">₹${totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Admin Action Link -->
          <div style="text-align: center; margin: 26px 0 16px 0;">
            <a href="${frontendUrl}/admin" style="display: inline-block; padding: 12px 28px; background-color: #B12B2B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(177, 43, 43, 0.2);">
              Open Orders in Admin Portal
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            This is an automated administrative notification sent from the JADMAA Varmakalai online store.
          </p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending product order alert for #${orderNumber} to admins: ${Array.from(adminEmails).join(', ')}`);

    adminEmails.forEach((adminEmail) => {
      BrevoService.sendEmail(adminEmail, subject, htmlContent).catch((err) => {
        console.error(`[EmailService] Error sending product order alert to admin ${adminEmail}:`, err);
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending product order admin notification:', error);
    return { success: false, reason: error.message };
  }
};

/**
 * Sends an order confirmation receipt email to the customer who placed the product order.
 */
export const sendProductOrderCustomerConfirmationEmail = async (
  params: ProductOrderNotificationParams
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const {
      orderNumber,
      userName,
      userEmail,
      deliveryAddress,
      deliveryPincode,
      items,
      subtotal,
      shippingCharge,
      totalAmount,
      paymentMethod = 'RAZORPAY',
      paymentId = '',
    } = params;

    if (!userEmail || !userEmail.includes('@')) {
      return { success: false, reason: 'Invalid customer email address' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://jadmaa.com';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const itemsRowsHtml = items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 8px; vertical-align: middle;">
          <div style="font-weight: 600; color: #111; font-size: 13px;">${item.productName}</div>
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; color: #444; font-size: 13px; text-align: right; white-space: nowrap;">
          ₹${item.unitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; font-weight: bold; color: #B12B2B; font-size: 13px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 8px; vertical-align: middle; font-weight: bold; color: #111; font-size: 13px; text-align: right; white-space: nowrap;">
          ₹${item.lineTotal.toLocaleString('en-IN')}
        </td>
      </tr>
    `
      )
      .join('');

    const subject = `✨ JADMAA Order Confirmed: #${orderNumber}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; color: #2B2521; background-color: #ffffff;">
        <div style="background-color: #B12B2B; padding: 22px 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">JADMAA VARMAKALAI</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Official Martial Arts & Healthcare Store</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0; line-height: 1.5;">
            Dear <strong>${userName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A;">
            Thank you for your order! We have received your payment and our dojo team is now preparing your items for delivery.
          </p>

          <div style="background-color: #FBF8F5; border: 1px solid #EFE8E0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 5px 0; color: #666; width: 140px;"><strong>Order Number:</strong></td>
                <td style="padding: 5px 0; color: #B12B2B; font-weight: bold;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;"><strong>Order Date:</strong></td>
                <td style="padding: 5px 0; color: #111;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; vertical-align: top;"><strong>Delivery Address:</strong></td>
                <td style="padding: 5px 0; color: #111; font-weight: 600; line-height: 1.4;">
                  ${deliveryAddress}
                  ${deliveryPincode ? `<br /><span style="color: #666; font-weight: normal;">Pincode: </span><strong>${deliveryPincode}</strong>` : ''}
                </td>
              </tr>
            </table>
          </div>

          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #B12B2B; text-transform: uppercase;">
            Order Items
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #FAF6F0; border-bottom: 2px solid #EFE8E0; color: #666; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 10px 8px; text-align: left;">Product</th>
                <th style="padding: 10px 8px; text-align: right;">Price</th>
                <th style="padding: 10px 8px; text-align: center;">Qty</th>
                <th style="padding: 10px 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; color: #666; font-size: 12px;">Subtotal:</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; color: #333; font-size: 13px;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 4px 8px; text-align: right; color: #666; font-size: 12px;">Shipping:</td>
                <td style="padding: 4px 8px; text-align: right; font-weight: 600; color: ${shippingCharge === 0 ? '#166534' : '#333'}; font-size: 13px;">
                  ${shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}
                </td>
              </tr>
              <tr style="border-top: 2px solid #EFE8E0;">
                <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #2B2521; font-size: 14px;">Total Paid:</td>
                <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #B12B2B; font-size: 16px;">₹${totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; margin: 26px 0 16px 0;">
            <a href="${frontendUrl}/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #2B2521; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              View My Orders
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            JADMAA Varmakalai Academy & Varma Clinic — Thanjavur • Kumbakonam • Ariyalur<br />
            Need assistance? Reach us at <strong>info@jadmaa.com</strong> or <strong>+91 93452 20020</strong>.
          </p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending order confirmation receipt to customer: ${userEmail}`);
    await BrevoService.sendEmail(userEmail, subject, htmlContent);
    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending customer order receipt:', error);
    return { success: false, reason: error.message };
  }
};


