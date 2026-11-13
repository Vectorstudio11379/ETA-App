/**
 * API & WordPress LMS Database Configuration for Expressteck
 * Live Domain: https://expressteck.tech
 */

export const API_CONFIG = {
  // Live WordPress site domain
  WORDPRESS_URL: 'https://expressteck.tech',

  // Disable mock data fallback completely
  ENABLE_MOCK_FALLBACK: false,

  // Default API Timeout in Milliseconds (generous for mobile connections)
  TIMEOUT_MS: 25000,

  // WordPress & ETA API Bridge Endpoints
  ENDPOINTS: {
    // Auth (ETA API Bridge)
    LOGIN: '/wp-json/eta/v1/login',
    REGISTER: '/wp-json/eta/v1/register',
    FORGOT_PASSWORD: '/wp-json/eta/v1/auth/forgot-password',
    VERIFY_RESET_CODE: '/wp-json/eta/v1/auth/verify-reset-code',
    RESET_PASSWORD: '/wp-json/eta/v1/auth/reset-password',

    // Live Public Course Catalog Endpoints
    ETA_COURSES: '/wp-json/eta/v1/courses',
    MTO_COURSES: '/wp-json/wp/v2/mto-course?_embed=1', // fallback, verified live

    // WordPress User Profile Endpoints
    USER_PROFILE: '/wp-json/eta/v1/profile',
    UPDATE_PROFILE: '/wp-json/eta/v1/profile',
    CURRENT_USER: '/wp-json/eta/v1/profile',

    COURSE_DETAILS: (id: string) => `/wp-json/wp/v2/mto-course/${id}`,

    // Categories, Instructors and Site Info
    CATEGORIES: '/wp-json/eta/v1/categories',
    INSTRUCTORS: '/wp-json/eta/v1/instructors',
    BUNDLES: '/wp-json/eta/v1/bundles',
    SITE_INFO: '/wp-json/eta/v1/site-info',
    COURSE_CURRICULUM: (id: string) => `/wp-json/eta/v1/course-details?id=${id}`,
    
    // User Synced Data Endpoints
    USER_ENROLLMENTS: '/wp-json/eta/v1/my-courses',
    MY_COURSES: '/wp-json/eta/v1/my-courses',
    USER_PROGRESS: '/wp-json/eta/v1/progress',
    USER_CART: '/wp-json/eta/v1/cart',
    USER_WISHLIST: '/wp-json/eta/v1/wishlist',
    USER_NOTIFICATIONS: '/wp-json/eta/v1/notifications',

    // Reviews & Ratings Endpoints
    COURSE_REVIEWS: (courseId?: string) => courseId ? `/wp-json/eta/v1/reviews?course_id=${courseId}` : '/wp-json/eta/v1/reviews',
    SUBMIT_REVIEW: '/wp-json/eta/v1/reviews',

    // Course Q&A Endpoints
    COURSE_QA: (courseId: string) => `/wp-json/eta/v1/course-qa?course_id=${courseId}`,
    SUBMIT_QUESTION: '/wp-json/eta/v1/course-qa',
    SUBMIT_QA_REPLY: '/wp-json/eta/v1/course-qa/reply',

    // Student Certificates & Verification
    MY_CERTIFICATES: '/wp-json/eta/v1/certificates',
    VERIFY_CERTIFICATE: (code: string) => `/wp-json/eta/v1/certificates/verify?code=${encodeURIComponent(code)}`,

    // Paystack & Website Payment Endpoints
    PAYSTACK_INITIALIZE: '/wp-json/eta/v1/checkout/initialize-paystack',
    PAYSTACK_VERIFY: '/wp-json/eta/v1/checkout/verify-paystack',
    PAYMENT_INITIALIZE: '/wp-json/eta/v1/payment/initialize',
    PAYMENT_VERIFY: '/wp-json/eta/v1/payment/verify',
    PAYMENT_STATUS: '/wp-json/eta/v1/payment/status',
    PAYMENT_COMPLETE_PAGE: '/payment-complete/',
    MOBILE_CHECKOUT_URL: (courseId: string, email: string) => `/mobile-checkout/?course_id=${courseId}&email=${encodeURIComponent(email)}`,
  },
};

export const getApiBaseUrl = (): string => {
  if (!API_CONFIG.WORDPRESS_URL) return '';
  return API_CONFIG.WORDPRESS_URL.replace(/\/+$/, '');
};
