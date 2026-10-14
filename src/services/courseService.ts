import { API_CONFIG } from '../config/apiConfig';
import { apiClient, ApiResponse } from './apiClient';
import { storageService } from './storage';
import { Course, Instructor, ModuleItem } from '../data/mockData';

// Helper to determine the authentic Expressteck category based on course title or slug
const resolveCategory = (title: string, slug?: string): string => {
  const lower = (title + ' ' + (slug || '')).toLowerCase();
  if (
    lower.includes('webhook') ||
    lower.includes('private') ||
    lower.includes('tracking') ||
    lower.includes('white label') ||
    lower.includes('customize')
  ) {
    return 'Customize & Automate Your Platform';
  }
  if (
    lower.includes('virtual classes') ||
    lower.includes('content drip') ||
    lower.includes('prerequisites') ||
    lower.includes('engage')
  ) {
    return 'Engage & Retain Your Learners';
  }
  if (
    lower.includes('multi-instructor') ||
    lower.includes('groups') ||
    lower.includes('stripe') ||
    lower.includes('monetiz') ||
    lower.includes('bundle')
  ) {
    return 'Monetize & Grow Your Academy';
  }
  return 'Build Your First Course';
};

import { INITIAL_COURSES } from '../data/initialCourses';

// Helper to return curriculum modules for a course
const resolveModules = (courseId: string, title: string, slug?: string): ModuleItem[] => {
  const match = INITIAL_COURSES.find(
    (c) =>
      String(c.id) === String(courseId) ||
      (slug && c.slug && c.slug === slug) ||
      (c.title && title && c.title.toLowerCase().trim() === title.toLowerCase().trim())
  );
  return match?.modules || [];
};

export const courseService = {
  /**
   * Fetch Live Course Catalog dynamically from Expressteck.tech
   */
  async fetchCourses(): Promise<ApiResponse<Course[]>> {
    // 1. Try ETA Plugin REST API (/wp-json/eta/v1/courses)
    let res = await apiClient.get(API_CONFIG.ENDPOINTS.ETA_COURSES);

    // 2. Fall back to Live WordPress REST API (/wp-json/wp/v2/mto-course?_embed=1)
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      res = await apiClient.get(API_CONFIG.ENDPOINTS.MTO_COURSES);
    }

    // 3. Fall back to embedded production catalog if network request is unreachable
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      console.warn('[CourseService] Live API unreachable or empty. Serving embedded production courses.');
      return { success: true, data: INITIAL_COURSES };
    }

    // Map live JSON items to app's Course model
    const courses: Course[] = res.data.map((item: any) => {
      const rawTitle = item.title?.rendered || item.title || item.name || 'Untitled Course';
      const cleanTitle = rawTitle
        .replace(/&#8211;/g, '-')
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .trim();

      const slug = item.slug || '';
      const category = item.category && item.category !== 'Development'
        ? item.category
        : resolveCategory(cleanTitle, slug);

      // Clean HTML description
      let rawDesc = item.excerpt?.rendered || item.content?.rendered || item.description || '';
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').replace(/\[&hellip;\]/g, '...').trim();

      // Featured thumbnail
      const embeddedImage = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      const thumbnail = embeddedImage || item.thumbnail || item.featured_image || 'https://expressteck.tech/wp-content/uploads/2025/10/Getting-Started-with-Masteriyo-LMS-1.jpg';

      const regularPrice = Number(item.originalPrice || item.meta?.regular_price || 25000);
      const salePrice = Number(item.price || item.meta?.price || 15000);
      const discountPct = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 40;

      // Extract real modules / curriculum
      const modules = item.modules && Array.isArray(item.modules) && item.modules.length > 0
        ? item.modules
        : resolveModules(item.id, cleanTitle, slug);

      const instructor = item.instructor || item._embedded?.author?.[0]?.name || 'Express Tech Academy';

      return {
        id: String(item.id),
        product_id: item.product_id ? String(item.product_id) : undefined,
        slug,
        title: cleanTitle,
        instructor: instructor.includes('@') ? 'Express Tech Academy' : instructor,
        category,
        originalPrice: regularPrice,
        price: salePrice,
        discount: discountPct,
        studentsCount: Number(item.studentsCount || 120),
        rating: Number(item.rating || 4.8),
        reviewsCount: Number(item.reviewsCount || 35),
        daysLeft: Number(item.daysLeft || 5),
        thumbnail,
        description: cleanDesc,
        isEnrolled: Boolean(item.isEnrolled),
        progress: Number(item.progress || 0),
        modules,
        requirements: [
          'Access to a computer, laptop, or smartphone.',
          'Internet connection for video lessons and materials.'
        ],
        certificateIssued: true,
      };
    });

    console.log(`[CourseService] Dynamically loaded ${courses.length} courses from Expressteck.tech`);
    return { success: true, data: courses };
  },

  /**
   * Fetch Course Details with full modules and curriculum dynamically
   */
  async fetchCourseDetails(courseId: string): Promise<ApiResponse<Course | null>> {
    const listRes = await this.fetchCourses();
    let found: Course | undefined;
    if (listRes.success && listRes.data) {
      found = listRes.data.find(
        (c) => c.id === courseId || c.product_id === courseId || c.slug === courseId
      );
    }

    // Retrieve full curriculum modules and lessons from API
    try {
      const curRes = await apiClient.get<any>(`${API_CONFIG.ENDPOINTS.COURSE_CURRICULUM(courseId)}`);
      if (curRes.success && curRes.data?.modules && Array.isArray(curRes.data.modules)) {
        if (found) {
          found.modules = curRes.data.modules;
        } else {
          found = {
            id: courseId,
            title: curRes.data.title || 'Course Masterclass',
            thumbnail: 'https://expressteck.tech/wp-content/uploads/2026/10/Getting-Started-with-Masteriyo-LMS-1.jpg',
            instructor: 'Express Tech Academy',
            category: 'Build Your First Course',
            price: 0,
            originalPrice: 0,
            discount: 0,
            studentsCount: 120,
            rating: 5.0,
            reviewsCount: 14,
            daysLeft: 0,
            modules: curRes.data.modules,
          };
        }
      }
    } catch (e) {
      console.warn('[CourseService] Could not load curriculum modules:', e);
    }

    if (found) {
      return { success: true, data: found };
    }
    return { success: false, error: 'Course not found' };
  },

  /**
   * Fetch dynamic categories from the live site
   */
  async fetchCategories(): Promise<{ id: string; name: string; icon: string }[]> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.CATEGORIES);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return [];
  },

  /**
   * Fetch dynamic instructors from the live site
   */
  async fetchInstructors(): Promise<Instructor[]> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.INSTRUCTORS);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return [];
  },

  /**
   * Fetch live site information (promo, FAQ, support email)
   */
  async fetchSiteInfo(): Promise<{ promoText: string; contactEmail: string; faqs: { q: string; a: string }[] }> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.SITE_INFO);
    if (res.success && res.data) {
      return res.data;
    }
    return {
      promoText: 'Limited Time Offer — Get Up to 70% Off Courses!',
      contactEmail: 'hello@expressteck.tech',
      faqs: [
        {
          q: 'After payment is confirmed, how do I begin?',
          a: 'Sign in to your account and open My Learning to begin immediately.',
        },
        {
          q: 'What format are the courses?',
          a: 'Courses are self-paced video classes. Any live-session information is shared inside the relevant course.',
        },
        {
          q: 'When does my certificate become available?',
          a: 'After completing all required lessons and activities, your certificate becomes available from your learning dashboard.',
        },
      ],
    };
  },

  /**
   * Fetch user's enrolled courses from Expressteck.tech
   */
  async fetchEnrolledCourses(): Promise<ApiResponse<Course[]>> {
    const token = await storageService.getUserToken();
    let email = '';
    try {
      const profileStr = await storageService.getItem(storageService.STORAGE_KEYS.USER_PROFILE);
      if (profileStr) {
        const parsed = JSON.parse(profileStr);
        email = parsed?.email || '';
      }
    } catch (e) {}

    if (!token && !email) {
      return { success: true, data: [] };
    }

    const queryParts: string[] = [];
    if (email) queryParts.push(`email=${encodeURIComponent(email)}`);
    if (token) queryParts.push(`auth_token=${encodeURIComponent(token)}`);
    const query = queryParts.length ? `?${queryParts.join('&')}` : '';

    const res = await apiClient.get(`${API_CONFIG.ENDPOINTS.USER_ENROLLMENTS}${query}`);
    const list = Array.isArray(res.data)
      ? res.data
      : (Array.isArray((res.data as any)?.enrolled) ? (res.data as any).enrolled : []);

    if (list.length > 0) {
      return {
        success: true,
        data: list.map((item: any) => ({
          id: String(item.id),
          product_id: item.product_id ? String(item.product_id) : undefined,
          slug: item.slug || '',
          title: item.title || 'Masterclass',
          thumbnail: item.thumbnail || 'https://expressteck.tech/wp-content/uploads/2026/10/1-1024x576.jpeg',
          instructor: item.instructor || 'Express Tech Academy',
          category: item.category || 'My Learning',
          price: Number(item.price || 0),
          originalPrice: Number(item.originalPrice || 0),
          discount: 0,
          studentsCount: Number(item.studentsCount || 148),
          rating: Number(item.rating || 5.0),
          reviewsCount: Number(item.reviewsCount || 28),
          daysLeft: 0,
          isEnrolled: true,
          progress: Number(item.progress || 15),
          modules: item.modules && Array.isArray(item.modules) && item.modules.length > 0
            ? item.modules
            : resolveModules(String(item.id), item.title || '', item.slug),
          requirements: [
            'Access to a computer, laptop, or smartphone.',
            'Internet connection for video lessons and materials.'
          ],
          certificateIssued: true,
        })),
      };
    }
    return {
      success: true,
      data: [],
    };
  },

  /**
   * Fetch Course Bundles from Expressteck.tech
   */
  async fetchBundles(): Promise<Course[]> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.BUNDLES);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((item: any) => ({
        id: String(item.id),
        slug: item.slug || '',
        title: item.title,
        instructor: item.instructor || 'Express Tech Academy',
        category: item.category || 'AI & Emerging Tech',
        originalPrice: Number(item.originalPrice || 40000),
        price: Number(item.price || 20000),
        discount: Number(item.discount || 50),
        studentsCount: Number(item.studentsCount || 200),
        rating: Number(item.rating || 4.9),
        reviewsCount: Number(item.reviewsCount || 45),
        daysLeft: Number(item.daysLeft || 5),
        isBundle: true,
        bundleBadge: item.bundleBadge || 'Special Bundle',
        packages: Array.isArray(item.packages) ? item.packages : [],
        thumbnail: item.thumbnail || 'https://expressteck.tech/wp-content/themes/express-tech-react/assets/images/ai-automation-course-thumbnail.jpg',
        description: item.description || '',
        modules: item.modules || [],
        requirements: item.requirements || [
          'Access to a computer, laptop, or smartphone.',
          'Internet connection for video lessons and materials.'
        ],
        outcomes: item.outcomes || [
          'Master practical real-world production technical skills',
          'Deploy automated workflows and tools'
        ],
        certificateIssued: true,
      }));
    }
    return [];
  },

  /**
   * Fetch student's real enrolled courses from Expressteck database
   */
  async fetchMyCourses(email?: string): Promise<ApiResponse<Course[]>> {
    const endpoint = email
      ? `${API_CONFIG.ENDPOINTS.MY_COURSES}?email=${encodeURIComponent(email)}`
      : API_CONFIG.ENDPOINTS.MY_COURSES;
    const res = await apiClient.get(endpoint);
    if (!res.success || !Array.isArray(res.data)) {
      return {
        success: true,
        data: [],
      };
    }
    return res;
  },

  /**
   * Initialize Paystack Checkout with unified WooCommerce backend
   */
  async initializePaystackCheckout(payload: {
    items: (string | number)[];
    email: string;
    name?: string;
    phone?: string;
    user_id?: number;
  }): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
    order_id: number;
    amount: number;
  }>> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PAYSTACK_INITIALIZE, payload);
  },

  /**
   * Verify Paystack Payment and trigger immediate WooCommerce order completion + Masteriyo enrollment
   */
  async verifyPaystackPayment(payload: {
    reference: string;
    order_id?: number;
  }): Promise<ApiResponse<{
    verified: boolean;
    status: string;
    order_id: number;
    enrolled_courses?: number[];
  }>> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PAYSTACK_VERIFY, payload);
  },

  /**
   * Save lesson progress to Expressteck.tech
   */
  async updateLessonProgress(courseId: string, lessonId: string, completed: boolean): Promise<ApiResponse<any>> {
    return apiClient.post(API_CONFIG.ENDPOINTS.USER_PROGRESS, {
      course_id: courseId,
      lesson_id: lessonId,
      completed,
    });
  },
};

