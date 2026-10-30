-- ============================================================================
-- JADMAA VARMAKALAI - MySQL Database Schema
-- Hostinger Premium Shared Hosting (MySQL 8.x / MariaDB)
-- UTF-8mb4 Character Encoding with Complete Foreign Keys & Indexes
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'STUDENT',
  `avatarUrl` TEXT NULL,
  `emailVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `isAdmin` TINYINT(1) NOT NULL DEFAULT 0,
  `lastLoginAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. INSTRUCTORS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `instructors` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL UNIQUE,
  `displayName` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `avatarUrl` TEXT NULL,
  `specialization` VARCHAR(255) NULL,
  `experience` VARCHAR(100) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_instructors_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. COURSES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NOT NULL,
  `longDescription` LONGTEXT NULL,
  `thumbnailUrl` TEXT NULL,
  `category` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  `duration` VARCHAR(100) NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `isFree` TINYINT(1) NOT NULL DEFAULT 0,
  `certificateEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `instructorId` VARCHAR(36) NOT NULL,
  `publishedAt` DATETIME NULL,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `reviewCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_courses_slug` (`slug`),
  INDEX `idx_courses_status` (`status`),
  INDEX `idx_courses_instructorId` (`instructorId`),
  INDEX `idx_courses_category` (`category`),
  CONSTRAINT `fk_courses_instructor` FOREIGN KEY (`instructorId`) REFERENCES `instructors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. COURSE MODULES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_modules` (
  `id` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_modules_courseId` (`courseId`),
  INDEX `idx_modules_sortOrder` (`sortOrder`),
  CONSTRAINT `fk_modules_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. LESSONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` VARCHAR(36) NOT NULL,
  `moduleId` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `youtubeVideoId` VARCHAR(100) NULL,
  `durationSeconds` INT NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isPreview` TINYINT(1) NOT NULL DEFAULT 0,
  `isRequired` TINYINT(1) NOT NULL DEFAULT 1,
  `isPublished` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_lessons_moduleId` (`moduleId`),
  INDEX `idx_lessons_sortOrder` (`sortOrder`),
  CONSTRAINT `fk_lessons_module` FOREIGN KEY (`moduleId`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. COURSE OFFERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_offers` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `shortDescription` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `bannerImageUrl` TEXT NULL,
  `popupImageUrl` TEXT NULL,
  `mobileImageUrl` TEXT NULL,
  `galleryImages` JSON NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'ONLINE_COURSE',
  `customCategory` VARCHAR(100) NULL,
  `targetAudience` VARCHAR(255) NULL,
  `branchLocation` VARCHAR(255) NULL,
  `courseId` VARCHAR(36) NULL,
  `pricingType` VARCHAR(50) NOT NULL DEFAULT 'FIXED_PRICE',
  `discountPercent` DECIMAL(5,2) NULL,
  `originalPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `offerPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `theme` VARCHAR(50) NOT NULL DEFAULT 'light',
  `primaryColor` VARCHAR(50) DEFAULT '#991B1B',
  `secondaryColor` VARCHAR(50) DEFAULT '#141416',
  `ctaType` VARCHAR(50) NOT NULL DEFAULT 'ENROLL_COURSE',
  `ctaText` VARCHAR(255) NULL,
  `ctaUrl` TEXT NULL,
  `secondaryCtaText` VARCHAR(255) NULL,
  `secondaryCtaUrl` TEXT NULL,
  `termsAndConditions` LONGTEXT NULL,
  `supportEmail` VARCHAR(255) NULL,
  `supportPhone` VARCHAR(50) NULL,
  `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `isEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `showPopup` TINYINT(1) NOT NULL DEFAULT 0,
  `popupPriority` INT NOT NULL DEFAULT 0,
  `startAt` DATETIME NULL,
  `expiresAt` DATETIME NULL,
  `countdownEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `bookingLimit` INT NULL,
  `currentBookings` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_offers_slug` (`slug`),
  INDEX `idx_offers_status_enabled` (`status`, `isEnabled`),
  INDEX `idx_offers_popup` (`showPopup`, `isEnabled`),
  INDEX `idx_offers_category` (`category`),
  INDEX `idx_offers_courseId` (`courseId`),
  CONSTRAINT `fk_offers_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NOT NULL,
  `gateway` ENUM('RAZORPAY', 'PHONEPE') NOT NULL DEFAULT 'RAZORPAY',
  `merchantOrderId` VARCHAR(255) NOT NULL UNIQUE,
  `gatewayTransactionId` VARCHAR(255) NULL UNIQUE,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentResponse` LONGTEXT NULL,
  `paidAt` DATETIME NULL,
  `offerId` VARCHAR(36) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_payments_userId` (`userId`),
  INDEX `idx_payments_courseId` (`courseId`),
  INDEX `idx_payments_merchantOrderId` (`merchantOrderId`),
  INDEX `idx_payments_offerId` (`offerId`),
  INDEX `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_payments_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`),
  CONSTRAINT `fk_payments_offer` FOREIGN KEY (`offerId`) REFERENCES `course_offers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. ENROLLMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NOT NULL,
  `paymentId` VARCHAR(36) NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `enrolledAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` DATETIME NULL,
  `expiresAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_enrollment_user_course` (`userId`, `courseId`),
  INDEX `idx_enrollments_userId` (`userId`),
  INDEX `idx_enrollments_courseId` (`courseId`),
  INDEX `idx_enrollments_status` (`status`),
  CONSTRAINT `fk_enrollments_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enrollments_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. LESSON PROGRESS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lesson_progress` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NOT NULL,
  `lessonId` VARCHAR(36) NOT NULL,
  `watchedSeconds` INT NOT NULL DEFAULT 0,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completedAt` DATETIME NULL,
  `lastWatchedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_progress_user_lesson` (`userId`, `lessonId`),
  INDEX `idx_progress_userId` (`userId`),
  INDEX `idx_progress_courseId` (`courseId`),
  INDEX `idx_progress_lessonId` (`lessonId`),
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_lesson` FOREIGN KEY (`lessonId`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. CERTIFICATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` VARCHAR(36) NOT NULL,
  `certificateNumber` VARCHAR(100) NOT NULL UNIQUE,
  `verificationCode` VARCHAR(100) NOT NULL UNIQUE,
  `userId` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NOT NULL,
  `issuedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `certificateUrl` TEXT NULL,
  `status` ENUM('ISSUED', 'REVOKED') NOT NULL DEFAULT 'ISSUED',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_certs_certNumber` (`certificateNumber`),
  INDEX `idx_certs_verifyCode` (`verificationCode`),
  INDEX `idx_certs_user` (`userId`),
  INDEX `idx_certs_course` (`courseId`),
  CONSTRAINT `fk_certs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_certs_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. OFFER BOOKINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `offer_bookings` (
  `id` VARCHAR(36) NOT NULL,
  `bookingNumber` VARCHAR(100) NOT NULL UNIQUE,
  `offerId` VARCHAR(36) NOT NULL,
  `courseId` VARCHAR(36) NULL,
  `userId` VARCHAR(36) NULL,
  `paymentId` VARCHAR(36) NULL UNIQUE,
  `enrollmentId` VARCHAR(36) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `customerName` VARCHAR(255) NULL,
  `customerEmail` VARCHAR(255) NULL,
  `customerPhone` VARCHAR(50) NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'ONLINE_COURSE',
  `notes` LONGTEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bookings_offerId` (`offerId`),
  INDEX `idx_bookings_courseId` (`courseId`),
  INDEX `idx_bookings_userId` (`userId`),
  INDEX `idx_bookings_status` (`status`),
  CONSTRAINT `fk_bookings_offer` FOREIGN KEY (`offerId`) REFERENCES `course_offers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`),
  CONSTRAINT `fk_bookings_enrollment` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. BLOG POSTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `content` LONGTEXT NOT NULL,
  `excerpt` TEXT NULL,
  `thumbnailUrl` TEXT NULL,
  `authorId` VARCHAR(36) NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_blogs_slug` (`slug`),
  INDEX `idx_blogs_author` (`authorId`),
  INDEX `idx_blogs_published` (`published`),
  CONSTRAINT `fk_blogs_author` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. ENQUIRIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `subject` VARCHAR(255) NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_enquiries_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. FAQS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(36) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(100) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isPublished` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_faqs_sortOrder` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. BRANCHES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branches` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `hours` VARCHAR(100) NULL,
  `mapEmbedUrl` TEXT NULL,
  `imageUrl` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL,
  `actorUserId` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(36) NULL,
  `metadata` LONGTEXT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_actor` (`actorUserId`),
  INDEX `idx_audit_entity` (`entityType`, `entityId`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actorUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. SYSTEM SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(191) NOT NULL UNIQUE,
  `value` LONGTEXT NOT NULL,
  `description` TEXT NULL,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. PASSWORD RESET TOKENS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `tokenHash` VARCHAR(255) NOT NULL UNIQUE,
  `expiresAt` DATETIME NOT NULL,
  `usedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_prt_user` (`userId`),
  INDEX `idx_prt_token` (`tokenHash`),
  INDEX `idx_prt_expires` (`expiresAt`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. PASSWORD RESET OTPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `phoneNumber` VARCHAR(50) NOT NULL,
  `otpHash` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `verifiedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_otp_user` (`userId`),
  INDEX `idx_otp_phone` (`phoneNumber`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. REFRESH SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refresh_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `tokenHash` VARCHAR(255) NOT NULL UNIQUE,
  `expiresAt` DATETIME NOT NULL,
  `revokedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sessions_user` (`userId`),
  INDEX `idx_sessions_token` (`tokenHash`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. PRODUCT CATEGORIES (E-Commerce)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_prodcat_slug` (`slug`),
  INDEX `idx_prodcat_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. PRODUCTS (E-Commerce)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` LONGTEXT NOT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `compareAtPrice` DECIMAL(10,2) NULL,
  `images` JSON NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `stockQuantity` INT NOT NULL DEFAULT 0,
  `lowStockThreshold` INT NOT NULL DEFAULT 5,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_products_category` (`categoryId`),
  INDEX `idx_products_slug` (`slug`),
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_active` (`isActive`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`categoryId`) REFERENCES `product_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. ORDERS (E-Commerce)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL,
  `orderNumber` VARCHAR(100) NOT NULL UNIQUE,
  `userId` VARCHAR(36) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shippingCharge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discountAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `shippingAddress` TEXT NOT NULL,
  `shippingPincode` VARCHAR(20) NOT NULL,
  `customerName` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(50) NULL,
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
  `paymentStatus` ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentTransactionId` VARCHAR(255) NULL,
  `merchantOrderId` VARCHAR(255) NULL UNIQUE,
  `orderStatus` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `trackingNumber` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `isStockRestored` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_user` (`userId`),
  INDEX `idx_orders_orderNum` (`orderNumber`),
  INDEX `idx_orders_merchantOrderId` (`merchantOrderId`),
  INDEX `idx_orders_paymentStatus` (`paymentStatus`),
  INDEX `idx_orders_orderStatus` (`orderStatus`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 24. ORDER ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NULL,
  `productName` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `image` TEXT NULL,
  `unitPrice` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `lineTotal` DECIMAL(10,2) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orderitems_order` (`orderId`),
  INDEX `idx_orderitems_product` (`productId`),
  CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderitems_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 25. INVENTORY TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NULL,
  `transactionType` ENUM('STOCK_ADDITION', 'STOCK_DEDUCTION', 'MANUAL_ADJUSTMENT', 'STOCK_RESTORATION') NOT NULL,
  `quantityChanged` INT NOT NULL,
  `previousStock` INT NOT NULL,
  `updatedStock` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `performedBy` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_inv_product` (`productId`),
  INDEX `idx_inv_order` (`orderId`),
  INDEX `idx_inv_type` (`transactionType`),
  CONSTRAINT `fk_inv_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
