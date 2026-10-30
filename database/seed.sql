-- ============================================================================
-- JADMAA VARMAKALAI - MySQL Seed Data
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Default Super Admin User (password: Admin@12345)
-- Bcrypt hash: $2a$10$wT80W3rXq4j1bVvMtz0p1ekGv6d6b1d8YqfN6Fw1E9V7H9FkM1v0G or standard bcrypt
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `passwordHash`, `role`, `avatarUrl`, `emailVerified`, `isActive`, `isAdmin`)
VALUES
('usr_admin_001', 'Admin', 'admin@jadmaa.com', '+919443158874', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SUPER_ADMIN', NULL, 1, 1, 1),
('usr_founder_001', 'Mr. Bojagarajan', 'founder@jadmaa.com', '+919443158874', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INSTRUCTOR', 'https://jadmaa.com/wp-content/uploads/2026/07/founder.webp', 1, 1, 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Founder Instructor Profile
INSERT INTO `instructors` (`id`, `userId`, `displayName`, `title`, `bio`, `avatarUrl`, `specialization`, `experience`, `isActive`)
VALUES
('inst_founder_001', 'usr_founder_001', 'Mr. Bojagarajan', 'Founder & Grandmaster', 'Grandmaster of Ancient Traditional Varmakalai with over 30 years of teaching martial science and holistic healing.', 'https://jadmaa.com/wp-content/uploads/2026/07/founder.webp', 'Varmakalai & Traditional Healing', '30+ Years', 1)
ON DUPLICATE KEY UPDATE `displayName`=VALUES(`displayName`);

-- 3. System Settings
INSERT INTO `system_settings` (`id`, `key`, `value`, `description`)
VALUES
('set_001', 'site_name', 'JADMAA VARMAKALAI', 'Official Academy Name'),
('set_002', 'support_email', 'info@jadmaa.com', 'Primary customer support email'),
('set_003', 'support_phone', '+91 94431 58874', 'Customer care phone number'),
('set_004', 'offer_popup_enabled', 'true', 'Global toggle for promotional popups'),
('set_005', 'offer_popup_delay_seconds', '4', 'Delay before showing promotional popup'),
('set_006', 'currency_symbol', '₹', 'Store currency symbol')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

-- 4. Default Product Categories
INSERT INTO `product_categories` (`id`, `name`, `slug`, `description`, `image`, `isActive`)
VALUES
('cat_001', 'Varma Herbs & Oils', 'varma-herbs-oils', 'Traditional herbal formulations and medicinal massage oils.', '/images/products/oils.jpg', 1),
('cat_002', 'Training Equipment', 'training-equipment', 'Traditional training weapons, wooden staffs, and practice gear.', '/images/products/gear.jpg', 1),
('cat_003', 'Books & Literature', 'books-literature', 'Authentic palm-leaf manuscripts translations and literature on Varmakalai.', '/images/products/books.jpg', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 5. Branches
INSERT INTO `branches` (`id`, `name`, `city`, `address`, `phone`, `email`, `hours`, `isActive`)
VALUES
('br_001', 'JADMAA Head Academy', 'Thanjavur', 'No. 12, Traditional Arts Complex, Medical College Road, Thanjavur, Tamil Nadu - 613004', '+91 94431 58874', 'thanjavur@jadmaa.com', 'Mon-Sat: 6:00 AM - 8:00 PM', 1),
('br_002', 'Kumbakonam Branch', 'Kumbakonam', 'Near Mahamaham Tank, Kumbakonam, Tamil Nadu - 612001', '+91 94431 58874', 'kumbakonam@jadmaa.com', 'Tue-Sun: 6:30 AM - 7:30 PM', 1),
('br_003', 'Ariyalur Training Centre', 'Ariyalur', 'Main Road, Near Bus Stand, Ariyalur, Tamil Nadu - 621704', '+91 94431 58874', 'ariyalur@jadmaa.com', 'Mon-Fri: 6:00 AM - 7:00 PM', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 6. Core Courses
INSERT INTO `courses` (`id`, `title`, `slug`, `subtitle`, `description`, `longDescription`, `thumbnailUrl`, `category`, `level`, `duration`, `price`, `isFree`, `certificateEnabled`, `status`, `instructorId`, `publishedAt`, `rating`, `reviewCount`)
VALUES
('crs_001', 'Basic Varma Training Course | Learn Varmakalai from Scratch | JADMAA', '1-basic-varmakalai-training', 'Learn the fundamentals of Varmakalai', 'Basic Varma Training at JADMAA — learn the fundamentals of Varmakalai: vital points, stances, breathing and safe practice.', 'Comprehensive hands-on training for beginners into ancient Tamil martial science.', '/images/optimized/course-basic-768w.webp', 'Varmakalai', 'Beginner', '4 Weeks', 1999.00, 0, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 4.9, 120),
('crs_002', 'Intermediate Varmakalai Training Course | JADMAA Varmakalai', '2-intermediate-varmakalai-training', 'Deeper Varma point work and applied technique', 'Intermediate Varmakalai training for students who know the basics — deeper Varma point work, applied technique and traditional practice.', 'Advanced point strikes, defensive locks, and pressure point releases.', '/images/optimized/course-intermediate-768w.webp', 'Varmakalai', 'Intermediate', '6 Weeks', 2999.00, 0, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 4.8, 85),
('crs_003', 'Kids Self-Defence Classes in Thanjavur | Varmakalai for Children | JADMAA', '4-kids-self-defence-training', 'Builds confidence, focus and discipline', 'Self-defence classes for children built on traditional Varmakalai. Safe, supervised setting.', 'Empowering children with discipline, anti-bullying techniques, and posture awareness.', '/images/optimized/course-kids-768w.webp', 'Kids', 'Beginner', '8 Weeks', 1499.00, 0, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 5.0, 95),
('crs_004', 'Self-Defence Training for All Ages | Varmakalai Classes | JADMAA', '5-self-defence-training-for-all', 'Practical self-defence training rooted in Varmakalai', 'Practical self-defence training rooted in Varmakalai, open to all ages and fitness levels.', 'Real-world threat evasion, practical releases, and situational awareness.', '/images/optimized/course-selfdefence-all-768w.webp', 'Self-Defence', 'All Levels', '6 Weeks', 1999.00, 0, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 4.9, 110),
('crs_005', 'Women\'s Self-Defence Classes in Tamil Nadu | JADMAA Varmakalai', '6-womens-self-defence-program', 'Supportive women-friendly environment', 'Women\'s self-defence program at JADMAA — practical Varmakalai techniques for real situations.', 'High-impact vulnerability targeting, grab escapes, and confident defensive reflexes.', '/images/optimized/course-womens-768w.webp', 'Self-Defence', 'All Levels', '4 Weeks', 1999.00, 0, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 4.9, 140),
('crs_006', 'Free Varmakalai Foundation Course Online | JADMAA Varmakalai', 'varmakalai-foundation-free-starter-course', 'Start Varmakalai free', 'Start Varmakalai free. Our online foundation course covers the basics of Varma points, breathing and posture.', 'Introductory online modules to experience ancient Varmakalai without prior knowledge.', '/images/optimized/logo-1-601w.webp', 'Varmakalai', 'Beginner', '1 Week', 0.00, 1, 1, 'PUBLISHED', 'inst_founder_001', NOW(), 4.9, 320)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 7. Course Modules & Lessons for Starter Course
INSERT INTO `course_modules` (`id`, `courseId`, `title`, `description`, `sortOrder`)
VALUES
('mod_001', 'crs_006', 'Introduction to Varmakalai', 'Welcome and foundation philosophy', 1),
('mod_002', 'crs_006', 'Stances & Breathing (Pranayama)', 'Fundamental postures and vital energy regulation', 2)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `lessons` (`id`, `moduleId`, `title`, `description`, `youtubeVideoId`, `durationSeconds`, `sortOrder`, `isPreview`, `isRequired`, `isPublished`)
VALUES
('les_001', 'mod_001', 'Welcome to JADMAA Varmakalai', 'Introductory message from Grandmaster Bojagarajan', 'dQw4w9WgXcQ', 300, 1, 1, 1, 1),
('les_002', 'mod_001', 'What is Varmakalai? Vital Energy & Points', 'Understanding the science of human pressure channels', 'dQw4w9WgXcQ', 600, 2, 1, 1, 1),
('les_003', 'mod_002', 'First Stance: Nilai & Balance', 'Physical alignment and grounding exercises', 'dQw4w9WgXcQ', 720, 1, 0, 1, 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

SET FOREIGN_KEY_CHECKS = 1;
