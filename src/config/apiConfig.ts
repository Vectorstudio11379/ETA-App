/**
 * API & WordPress LMS Database Configuration for Expressteck
 * Live Domain: https://expressteck.tech
 */

export const API_CONFIG = {
  // Live WordPress site domain
  WORDPRESS_URL: 'https://expressteck.tech',

  // Enable mock data fallback if offline or request fails
  ENABLE_MOCK_FALLBACK: true,

  // Default API Timeout in Milliseconds
  TIMEOUT_MS: 15000,

  // WordPress & ETA API Bridge Endpoints
  ENDPOINTS: {
    // Auth (ETA API Bridge & JWT Endpoints)
    LOGIN: '/wp-json/eta/v1/login',
    REGISTER: '/wp-json/eta/v1/register',
    JWT_LOGIN_FALLBACK: '/wp-json/jwt-auth/v1/token',

    // Live Public Course Catalog Endpoints (Masteriyo WP REST API)
    MTO_COURSES: '/wp-json/wp/v2/mto-course?_embed=1',
    ETA_COURSES: '/wp-json/eta/v1/courses',
    MASTERIYO_COURSES: '/wp-json/masteriyo/v1/courses',

    // WordPress Core User Endpoints
    CURRENT_USER: '/wp-json/wp/v2/users/me',

    // Standard WordPress Core Post Types Fallback
    COURSES: '/wp-json/wp/v2/courses',
    COURSE_DETAILS: (id: string) => `/wp-json/wp/v2/mto-course/${id}`,
    LESSONS: (courseId: string) => `/wp-json/wp/v2/lessons?course=${courseId}`,
    
    // User Synced Data Endpoints
    USER_ENROLLMENTS: '/wp-json/eta/v1/progress',
    USER_PROGRESS: '/wp-json/eta/v1/progress',
    USER_CART: '/wp-json/eta/v1/cart',
    USER_WISHLIST: '/wp-json/eta/v1/wishlist',
    USER_NOTIFICATIONS: '/wp-json/eta/v1/notifications',
  },
};

export const getApiBaseUrl = (): string => {
  if (!API_CONFIG.WORDPRESS_URL) return '';
  return API_CONFIG.WORDPRESS_URL.replace(/\/+$/, '');
};
