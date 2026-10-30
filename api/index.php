<?php
declare(strict_types=1);

/**
 * JADMAA VARMAKALAI - Primary PHP API Gateway
 * Hostinger Premium Shared Hosting Entrypoint
 */

// 1. PSR-4 Autoloader
spl_autoload_register(function (string $class) {
    $prefix = 'Jadmaa\\';
    $baseDir = __DIR__ . DIRECTORY_SEPARATOR;

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use Jadmaa\Config\Database;
use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Router;
use Jadmaa\Middleware\AuthMiddleware;

use Jadmaa\Modules\Auth\AuthController;
use Jadmaa\Modules\Auth\PasswordController;
use Jadmaa\Modules\Courses\CourseController;
use Jadmaa\Modules\Enrollments\EnrollmentController;
use Jadmaa\Modules\Progress\ProgressController;
use Jadmaa\Modules\Instructor\InstructorController;
use Jadmaa\Modules\Payments\PaymentController;
use Jadmaa\Modules\Products\ProductController;
use Jadmaa\Modules\Orders\OrderController;
use Jadmaa\Modules\Offers\OfferController;
use Jadmaa\Modules\Offers\Admin\OfferAdminController;
use Jadmaa\Modules\Blog\BlogController;
use Jadmaa\Modules\Reviews\ReviewsController;
use Jadmaa\Modules\Admin\AdminController;
use Jadmaa\Modules\Upload\UploadController;

// 2. Load Environment Variables
Database::loadEnv();

// 3. Initialize Request & Router
$request = new Request();
$router = new Router();

// 4. Global Middleware: CORS & Response Headers
$router->use(function (Request $req) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, x-refresh-token, x-razorpay-signature');
    header('Access-Control-Allow-Credentials: true');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
});

// ==========================================
// HEALTH & PUBLIC SETTINGS
// ==========================================
$router->get('/api/health', function (Request $req) {
    Response::json(['status' => 'ok', 'timestamp' => date('c'), 'runtime' => 'PHP ' . phpversion()]);
});

$router->get('/api/v1/settings', function (Request $req) {
    header('Cache-Control: public, max-age=60, s-maxage=300');
    $pdo = Database::getPdo();
    $stmt = $pdo->query('SELECT `key`, `value`, description FROM system_settings');
    Response::success($stmt->fetchAll());
});

// ==========================================
// AUTH MODULE (/api/v1/auth)
// ==========================================
$router->post('/api/v1/auth/register', [AuthController::class, 'register']);
$router->post('/api/v1/auth/login', [AuthController::class, 'login']);
$router->get('/api/v1/auth/check-instructor', [AuthController::class, 'checkInstructorStatus']);
$router->post('/api/v1/auth/refresh', [AuthController::class, 'refresh']);
$router->post('/api/v1/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/v1/auth/me', [AuthController::class, 'getMe']);
$router->put('/api/v1/auth/update-profile', [AuthController::class, 'updateProfile']);

$router->post('/api/v1/auth/forgot-password', [PasswordController::class, 'forgotPassword']);
$router->post('/api/v1/auth/reset-password', [PasswordController::class, 'resetPassword']);
$router->post('/api/v1/auth/change-password', [PasswordController::class, 'changePassword']);

// ==========================================
// COURSES MODULE (/api/v1/courses)
// ==========================================
$router->get('/api/v1/courses', [CourseController::class, 'getCourses']);
$router->get('/api/v1/courses/:slug', [CourseController::class, 'getCourseBySlug']);

// ==========================================
// ENROLLMENTS MODULE (/api/v1/enrollments)
// ==========================================
$router->post('/api/v1/enrollments/free', [EnrollmentController::class, 'enrollFreeCourse']);

// ==========================================
// STUDENT PROGRESS & DASHBOARD (/api/v1/me)
// ==========================================
$router->get('/api/v1/me/dashboard', [ProgressController::class, 'getDashboard']);
$router->get('/api/v1/me/certificates', [ProgressController::class, 'getCertificates']);
$router->get('/api/v1/me/enrollments', [ProgressController::class, 'getMyEnrollments']);
$router->get('/api/v1/me/courses/:courseId/progress', [ProgressController::class, 'getCourseProgress']);
$router->post('/api/v1/me/lessons/:lessonId/progress', [ProgressController::class, 'updateLessonProgress']);

// ==========================================
// INSTRUCTOR MODULE (/api/v1/instructor)
// ==========================================
$router->get('/api/v1/instructor/dashboard', [InstructorController::class, 'getInstructorDashboard']);
$router->get('/api/v1/instructor/courses', [InstructorController::class, 'getInstructorCourses']);
$router->post('/api/v1/instructor/courses', [InstructorController::class, 'createInstructorCourse']);
$router->put('/api/v1/instructor/courses/:id', [InstructorController::class, 'updateInstructorCourse']);
$router->patch('/api/v1/instructor/courses/:id', [InstructorController::class, 'updateInstructorCourse']);
$router->delete('/api/v1/instructor/courses/:id', [InstructorController::class, 'deleteInstructorCourse']);
$router->get('/api/v1/instructor/students', [InstructorController::class, 'getInstructorStudents']);
$router->patch('/api/v1/instructor/students/:id/status', [InstructorController::class, 'updateInstructorStudentStatus']);

// ==========================================
// PAYMENTS MODULE (/api/v1/payments)
// ==========================================
$router->post('/api/v1/payments/create-order', [PaymentController::class, 'createOrder']);
$router->post('/api/v1/payments/verify', [PaymentController::class, 'verifyRazorpayPayment']);
$router->post('/api/v1/payments/webhook', [PaymentController::class, 'razorpayWebhook']);
$router->get('/api/v1/payments/status/:merchantOrderId', [PaymentController::class, 'checkPaymentStatus']);

// ==========================================
// PRODUCTS & E-COMMERCE (/api/v1/products)
// ==========================================
$router->get('/api/v1/products', [ProductController::class, 'getProducts']);
$router->get('/api/v1/products/categories', [ProductController::class, 'getCategories']);
$router->get('/api/v1/products/categories/:slug', [ProductController::class, 'getCategoryBySlug']);
$router->get('/api/v1/products/detail/:slug', [ProductController::class, 'getProductBySlug']);

$router->get('/api/v1/products/admin/list', [ProductController::class, 'adminGetProducts']);
$router->get('/api/v1/products/admin/inventory/logs', [ProductController::class, 'getInventoryLogs']);
$router->get('/api/v1/products/admin/inventory/low-stock-alerts', [ProductController::class, 'getLowStockAlerts']);
$router->post('/api/v1/products/admin/inventory/adjust', [ProductController::class, 'adjustStock']);
$router->get('/api/v1/products/admin/:id', [ProductController::class, 'adminGetProductById']);
$router->post('/api/v1/products/admin', [ProductController::class, 'createProduct']);
$router->put('/api/v1/products/admin/:id', [ProductController::class, 'updateProduct']);
$router->delete('/api/v1/products/admin/:id', [ProductController::class, 'deleteProduct']);
$router->post('/api/v1/products/admin/categories', [ProductController::class, 'createCategory']);
$router->put('/api/v1/products/admin/categories/:id', [ProductController::class, 'updateCategory']);
$router->delete('/api/v1/products/admin/categories/:id', [ProductController::class, 'deleteCategory']);

// ==========================================
// ORDERS MODULE (/api/v1/orders)
// ==========================================
$router->post('/api/v1/orders/checkout', [OrderController::class, 'createOrder']);
$router->post('/api/v1/orders/verify-payment', [OrderController::class, 'verifyOrderPayment']);
$router->get('/api/v1/orders/my-orders', [OrderController::class, 'getUserOrders']);
$router->get('/api/v1/orders/my-orders/:id', [OrderController::class, 'getUserOrderById']);

$router->get('/api/v1/orders/admin/list', [OrderController::class, 'adminGetOrders']);
$router->get('/api/v1/orders/admin/:id', [OrderController::class, 'adminGetOrderById']);
$router->put('/api/v1/orders/admin/:id/status', [OrderController::class, 'adminUpdateOrderStatus']);

// ==========================================
// OFFERS & CAMPAIGNS (/api/v1/offers)
// ==========================================
$router->get('/api/v1/offers/active-popup', [OfferController::class, 'getActivePopupOffer']);
$router->get('/api/v1/offers/:slug', [OfferController::class, 'getOfferBySlug']);
$router->post('/api/v1/offers/:slug/book', [OfferController::class, 'initiateOfferBooking']);
$router->post('/api/v1/offers/:slug/verify', [OfferController::class, 'verifyOfferPayment']);
$router->post('/api/v1/offers/:slug/enquire', [OfferController::class, 'submitOfferEnquiry']);

$router->get('/api/v1/admin/offers', [OfferAdminController::class, 'getAdminOffers']);
$router->post('/api/v1/admin/offers', [OfferAdminController::class, 'createOffer']);
$router->get('/api/v1/admin/offers/settings', [OfferAdminController::class, 'getOfferSettings']);
$router->put('/api/v1/admin/offers/settings', [OfferAdminController::class, 'updateOfferSettings']);
$router->get('/api/v1/admin/offers/bookings', [OfferAdminController::class, 'getOfferBookings']);
$router->get('/api/v1/admin/offers/:id', [OfferAdminController::class, 'getAdminOfferById']);
$router->put('/api/v1/admin/offers/:id', [OfferAdminController::class, 'updateOffer']);
$router->patch('/api/v1/admin/offers/:id/toggle', [OfferAdminController::class, 'toggleOffer']);
$router->post('/api/v1/admin/offers/:id/duplicate', [OfferAdminController::class, 'duplicateOffer']);
$router->delete('/api/v1/admin/offers/:id', [OfferAdminController::class, 'deleteOffer']);

// ==========================================
// BLOG MODULE (/api/v1/blogs)
// ==========================================
$router->get('/api/v1/blogs', [BlogController::class, 'getBlogs']);
$router->get('/api/v1/blogs/:slug', [BlogController::class, 'getBlogBySlug']);
$router->post('/api/v1/blogs', [BlogController::class, 'createBlog']);
$router->put('/api/v1/blogs/:id', [BlogController::class, 'updateBlog']);
$router->delete('/api/v1/blogs/:id', [BlogController::class, 'deleteBlog']);

// ==========================================
// REVIEWS MODULE (/api/v1/reviews)
// ==========================================
$router->get('/api/v1/reviews', [ReviewsController::class, 'getReviews']);

// ==========================================
// UPLOADS MODULE (/api/v1/upload)
// ==========================================
$router->post('/api/v1/upload', [UploadController::class, 'uploadImage']);

// ==========================================
// ADMIN MODULE (/api/v1/admin)
// ==========================================
$router->get('/api/v1/admin/dashboard/stats', [AdminController::class, 'getDashboardStats']);
$router->get('/api/v1/admin/analytics', [AdminController::class, 'getAnalytics']);

$router->get('/api/v1/admin/students', [AdminController::class, 'getStudents']);
$router->get('/api/v1/admin/students/:id', [AdminController::class, 'getStudentById']);
$router->patch('/api/v1/admin/students/:id/status', [AdminController::class, 'updateStudentStatus']);

$router->get('/api/v1/admin/instructors', [AdminController::class, 'getInstructors']);
$router->post('/api/v1/admin/instructors', [AdminController::class, 'createInstructor']);
$router->get('/api/v1/admin/instructors/applications', [AdminController::class, 'getInstructorApplications']);
$router->post('/api/v1/admin/instructors/applications/approve', [AdminController::class, 'approveInstructorApplication']);
$router->post('/api/v1/admin/instructors/applications/reject', [AdminController::class, 'rejectInstructorApplication']);
$router->get('/api/v1/admin/instructors/:id', [AdminController::class, 'getInstructorById']);
$router->patch('/api/v1/admin/instructors/:id', [AdminController::class, 'updateInstructor']);
$router->patch('/api/v1/admin/instructors/:id/status', [AdminController::class, 'updateInstructorStatus']);

$router->get('/api/v1/admin/courses', [AdminController::class, 'getCourses']);
$router->post('/api/v1/admin/courses', [AdminController::class, 'createCourse']);
$router->get('/api/v1/admin/courses/:id', [AdminController::class, 'getCourseById']);
$router->patch('/api/v1/admin/courses/:id', [AdminController::class, 'updateCourse']);
$router->delete('/api/v1/admin/courses/:id', [AdminController::class, 'deleteCourse']);
$router->post('/api/v1/admin/courses/:id/publish', [AdminController::class, 'publishCourse']);
$router->post('/api/v1/admin/courses/:id/unpublish', [AdminController::class, 'unpublishCourse']);
$router->patch('/api/v1/admin/courses/:id/availability', [AdminController::class, 'updateCourseAvailability']);

$router->post('/api/v1/admin/modules', [AdminController::class, 'createModule']);
$router->patch('/api/v1/admin/modules/:id', [AdminController::class, 'updateModule']);
$router->delete('/api/v1/admin/modules/:id', [AdminController::class, 'deleteModule']);

$router->post('/api/v1/admin/lessons', [AdminController::class, 'createLesson']);
$router->patch('/api/v1/admin/lessons/:id', [AdminController::class, 'updateLesson']);
$router->delete('/api/v1/admin/lessons/:id', [AdminController::class, 'deleteLesson']);

$router->get('/api/v1/admin/enrollments', [AdminController::class, 'getEnrollments']);
$router->get('/api/v1/admin/enrollments/:id', [AdminController::class, 'getEnrollmentById']);

$router->get('/api/v1/admin/payments', [AdminController::class, 'getPayments']);
$router->get('/api/v1/admin/payments/:id', [AdminController::class, 'getPaymentById']);
$router->post('/api/v1/admin/payments/:id/refund', [AdminController::class, 'refundPayment']);

$router->get('/api/v1/admin/certificates', [AdminController::class, 'getCertificates']);
$router->get('/api/v1/admin/certificates/:id', [AdminController::class, 'getCertificateById']);
$router->post('/api/v1/admin/certificates/:id/revoke', [AdminController::class, 'revokeCertificate']);

$router->post('/api/v1/admin/enquiries/public', [AdminController::class, 'submitPublicEnquiry']);
$router->get('/api/v1/admin/enquiries', [AdminController::class, 'getEnquiries']);
$router->get('/api/v1/admin/enquiries/:id', [AdminController::class, 'getEnquiryById']);
$router->patch('/api/v1/admin/enquiries/:id/status', [AdminController::class, 'updateEnquiryStatus']);
$router->delete('/api/v1/admin/enquiries/:id', [AdminController::class, 'deleteEnquiry']);

$router->get('/api/v1/admin/administrators', [AdminController::class, 'getAdministrators']);
$router->post('/api/v1/admin/administrators', [AdminController::class, 'createAdministrator']);
$router->patch('/api/v1/admin/administrators/:id', [AdminController::class, 'updateAdministrator']);
$router->patch('/api/v1/admin/administrators/:id/status', [AdminController::class, 'updateAdministratorStatus']);
$router->get('/api/v1/admin/audit-logs', [AdminController::class, 'getAuditLogs']);

$router->get('/api/v1/admin/settings', [AdminController::class, 'getSettings']);
$router->patch('/api/v1/admin/settings', [AdminController::class, 'updateSettings']);

// 5. Dispatch Request
$router->dispatch($request);
