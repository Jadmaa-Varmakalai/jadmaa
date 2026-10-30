# Hostinger Premium Shared Hosting - PHP Migration Guide
**JADMAA VARMAKALAI Academy of Ancient Tamil Martial Science**

---

## 1. Overview & Architecture

This application has been migrated from Express + Prisma (PostgreSQL) to a high-performance, native PHP 8.x REST API with PDO + MySQL, purpose-built for Hostinger Premium shared hosting.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (SPA)
- **Backend**: Native PHP 8.1+ REST API (zero Composer dependencies required on server)
- **Database**: MySQL 8.x / MariaDB with PDO prepared statements & UTF-8mb4
- **Payment Gateway**: Razorpay (order creation, client HMAC-SHA256 verification, and asynchronous webhooks)
- **Email Service**: Brevo (Sendinblue) transactional email API with native PHP fallback
- **Routing**: Apache `.htaccess` with seamless routing for `/api/*` to `api/index.php` and React SPA fallback to `index.html`

---

## 2. Directory Structure on Hostinger (`public_html`)

```text
public_html/
├── api/
│   ├── config/
│   │   └── Database.php
│   ├── core/
│   │   ├── JWT.php
│   │   ├── Request.php
│   │   ├── Response.php
│   │   ├── Router.php
│   │   └── Utils.php
│   ├── middleware/
│   │   └── AuthMiddleware.php
│   ├── modules/
│   │   ├── admin/
│   │   │   └── AdminController.php
│   │   ├── auth/
│   │   │   ├── AuthController.php
│   │   │   └── PasswordController.php
│   │   ├── blog/
│   │   │   └── BlogController.php
│   │   ├── courses/
│   │   │   └── CourseController.php
│   │   ├── enrollments/
│   │   │   └── EnrollmentController.php
│   │   ├── instructor/
│   │   │   └── InstructorController.php
│   │   ├── offers/
│   │   │   ├── OfferController.php
│   │   │   └── admin/
│   │   │       └── OfferAdminController.php
│   │   ├── orders/
│   │   │   └── OrderController.php
│   │   ├── payments/
│   │   │   └── PaymentController.php
│   │   ├── products/
│   │   │   └── ProductController.php
│   │   ├── progress/
│   │   │   └── ProgressController.php
│   │   ├── reviews/
│   │   │   └── ReviewsController.php
│   │   └── upload/
│   │       └── UploadController.php
│   ├── services/
│   │   ├── EmailService.php
│   │   └── RazorpayService.php
│   └── index.php
├── assets/                  # Compiled React Vite assets (.js, .css)
├── database/
│   ├── schema.sql           # MySQL DDL (25 tables)
│   └── seed.sql             # Initial courses, admin user, settings
├── public/
│   └── uploads/             # User uploads (chmod 755 or 775)
├── .env                     # Hostinger database & API credentials
├── .htaccess                # Apache routing & security headers
├── favicon.ico
└── index.html               # React SPA root HTML
```

---

## 3. Hostinger Database Setup

1. Log into your Hostinger **hPanel**.
2. Navigate to **Databases** > **MySQL Databases**.
3. Create a new database:
   - Database Name: `u123456789_jadmaa`
   - Username: `u123456789_admin`
   - Password: `<secure-database-password>`
4. Click on **Enter phpMyAdmin**.
5. Select your database, open the **Import** tab:
   - Import `database/schema.sql`
   - Import `database/seed.sql`

---

## 4. Environment Variables (`.env`)

Create or update the `.env` file in the root of `public_html/`:

```env
# Database Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u123456789_jadmaa
DB_USER=u123456789_admin
DB_PASSWORD=<secure-database-password>

# JWT Authentication
JWT_SECRET=<generate-strong-32-character-secret>
JWT_REFRESH_SECRET=<generate-strong-32-character-secret>

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Brevo Transactional Email API
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_NAME="JADMAA VARMAKALAI"
BREVO_SENDER_EMAIL=info@jadmaa.com
ADMIN_NOTIFICATION_EMAIL=admin@jadmaa.com

# Site Configuration
APP_URL=https://jadmaa.com
FRONTEND_URL=https://jadmaa.com
```

---

## 5. Build & Deployment Steps

1. In your local repository, build the React 19 frontend:
   ```bash
   npm run build
   ```
2. Upload the following to Hostinger's `public_html/`:
   - All files and folders from local `dist/` (including `index.html`, `assets/`, `images/`)
   - The `api/` folder
   - The `database/` folder
   - `.htaccess`
   - `.env`
3. Ensure write permissions for uploaded media:
   ```bash
   chmod 755 public_html/public/uploads
   ```

---

## 6. Verification Checklist

- [x] **API Health**: `GET /api/health` returns status `ok` and PHP runtime version.
- [x] **Public Settings**: `GET /api/v1/settings` returns academy settings.
- [x] **Auth Endpoints**: Register, login, refresh, profile update, password reset.
- [x] **Courses**: `GET /api/v1/courses`, `GET /api/v1/courses/:slug`.
- [x] **LMS Student Progress**: Dashboard stats, lesson completion, automated certificate issuance.
- [x] **Instructor Portal**: Instructor dashboard, courses management, student progress.
- [x] **Razorpay Payment Flow**:
  - Course order creation: `POST /api/v1/payments/create-order`
  - Signature verification: `POST /api/v1/payments/verify`
  - Webhooks: `POST /api/v1/payments/webhook`
- [x] **E-Commerce**: Products catalog, categories, cart checkout, stock deduction, order tracking.
- [x] **Campaign & Offers**: Promotional popups, offer bookings, and admin campaign builder.
- [x] **Admin Center**: Platform stats, user management, audit logs, enquiries.
