import { API_CONFIG } from '../config/apiConfig';
import { apiClient, ApiResponse } from './apiClient';
import { storageService } from './storage';
import { Course, Instructor, LessonItem, ModuleItem, CourseReviewItem, CourseQAItem, CourseQAReply, CertificateItem } from '../data/mockData';

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
import { INITIAL_BUNDLES } from '../data/initialBundles';

const bundledLessonsById = new Map<string, LessonItem>();
for (const course of INITIAL_COURSES) {
  for (const module of course.modules || []) {
    for (const lesson of module.lessons || []) {
      bundledLessonsById.set(String(lesson.id), lesson);
    }
  }
}

const normalizeCourseTitle = (title: string): string =>
  title
    .replace(/&amp;/gi, '&')
    .replace(/&#038;/gi, '&')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const getCourseIdentity = (course: Course): string[] => {
  const identifiers = [course.id, course.product_id]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value && value !== 'undefined' && value !== 'null'))
    .map((value) => `id:${value}`);
  const slug = course.slug?.trim().toLowerCase();
  if (slug) identifiers.push(`slug:${slug}`);
  return identifiers;
};

const isSameCourse = (first: Course, second: Course): boolean => {
  const firstIdentity = getCourseIdentity(first);
  const secondIdentity = getCourseIdentity(second);
  if (firstIdentity.some((identity) => secondIdentity.includes(identity))) return true;

  return (
    (!firstIdentity.length || !secondIdentity.length) &&
    normalizeCourseTitle(first.title) === normalizeCourseTitle(second.title)
  );
};

export const deduplicateCourses = (courses: Course[]): Course[] => {
  const uniqueCourses: Course[] = [];

  for (const course of courses) {
    const duplicateIndex = uniqueCourses.findIndex((existing) => isSameCourse(existing, course));
    if (duplicateIndex === -1) {
      uniqueCourses.push(course);
      continue;
    }

    const existing = uniqueCourses[duplicateIndex];
    uniqueCourses[duplicateIndex] = {
      ...existing,
      product_id: existing.product_id || course.product_id,
      slug: existing.slug || course.slug,
      thumbnail: existing.thumbnail || course.thumbnail,
      modules: existing.modules?.length ? existing.modules : course.modules,
      isEnrolled: Boolean(existing.isEnrolled || course.isEnrolled),
      progress: Math.max(existing.progress || 0, course.progress || 0),
    };
  }

  return uniqueCourses;
};

// Helper to return curriculum modules for a course
const resolveModules = (courseId: string, title: string, slug?: string): ModuleItem[] => {
  const match = INITIAL_COURSES.find(
    (c) =>
      String(c.id) === String(courseId) ||
      (slug && c.slug && c.slug === slug) ||
      (c.title && title && normalizeCourseTitle(c.title) === normalizeCourseTitle(title))
  );
  return match?.modules || [];
};

const mergeCourseModules = (
  modules: ModuleItem[] | undefined,
  fallbackModules: ModuleItem[]
): ModuleItem[] => {
  const sourceModules = modules?.length ? modules : fallbackModules;

  return sourceModules.map((module) => ({
    ...module,
    lessons: module.lessons?.map((lesson) => {
      const bundledLesson = bundledLessonsById.get(String(lesson.id));
      const summary = lesson.summary?.trim() ? lesson.summary : bundledLesson?.summary;
      const assignmentData = lesson.assignmentData ?? bundledLesson?.assignmentData ?? (
        lesson.type === 'assignment' && summary
          ? { title: lesson.title, description: summary }
          : undefined
      );

      return {
        ...bundledLesson,
        ...lesson,
        videoUrl: lesson.videoUrl?.trim() ? lesson.videoUrl : bundledLesson?.videoUrl,
        summary,
        quizData: lesson.quizData ?? bundledLesson?.quizData,
        assignmentData,
      };
    }),
  }));
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

    // 3. No silent fallback to the course list bundled in the app: it goes stale
    //    (old courses and prices). Report the failure so the UI can show offline/retry.
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      console.log(`[CourseService] Live API unavailable (${res.error || 'empty response'}).`);
      return {
        success: false,
        error: res.error || 'Could not load courses. Check your connection and try again.',
        statusCode: res.statusCode,
      };
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
      const fallbackModules = resolveModules(item.id, cleanTitle, slug);
      const modules = mergeCourseModules(
        Array.isArray(item.modules) ? item.modules : undefined,
        fallbackModules
      );

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
    return { success: true, data: deduplicateCourses(courses) };
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
        const fallbackModules = found?.modules || resolveModules(courseId, curRes.data.title || '', found?.slug);
        const modules = mergeCourseModules(curRes.data.modules, fallbackModules);
        if (found) {
          found.modules = modules;
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
            modules,
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
    // The server identifies the student from the Bearer token that apiClient sends.
    const token = await storageService.getUserToken();
    if (!token) {
      return { success: true, data: [] };
    }

    const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_ENROLLMENTS);
    if (!res.success) {
      return { success: false, error: res.error, statusCode: res.statusCode, data: [] };
    }
    const list = Array.isArray(res.data)
      ? res.data
      : (Array.isArray((res.data as any)?.enrolled) ? (res.data as any).enrolled : []);

    if (list.length > 0) {
      const courses: Course[] = list.map((item: any) => ({
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
          modules: mergeCourseModules(
            Array.isArray(item.modules) ? item.modules : undefined,
            resolveModules(String(item.id), item.title || '', item.slug)
          ),
          requirements: [
            'Access to a computer, laptop, or smartphone.',
            'Internet connection for video lessons and materials.'
          ],
          certificateIssued: true,
        }));
      return { success: true, data: deduplicateCourses(courses) };
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
    // The server wraps the list: { success: true, data: [...] }. Accept a bare array too.
    const list: any[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
    if (res.success && list.length > 0) {
      return list.map((item: any) => ({
        id: String(item.id),
        product_id: item.product_id ? String(item.product_id) : undefined,
        slug: item.slug || '',
        title: item.title,
        instructor: item.instructor || 'Express Tech Academy',
        category: item.category || 'Customize & Automate Your Platform',
        originalPrice: Number(item.originalPrice ?? item.original_price ?? 0),
        price: Number(item.price ?? item.sale_price ?? 0),
        discount: Number(item.discount ?? item.savings_percent ?? 0),
        studentsCount: Number(item.studentsCount || 200),
        rating: Number(item.rating || 4.9),
        reviewsCount: Number(item.reviewsCount || 45),
        daysLeft: Number(item.daysLeft || 5),
        isBundle: true,
        bundleBadge: item.bundleBadge || 'Special Bundle',
        // `packages` must hold course IDs. The server's `packages` field holds course
        // titles, so prefer `course_ids`.
        packages: Array.isArray(item.course_ids)
          ? item.course_ids.map(String)
          : (Array.isArray(item.packages) ? item.packages.map(String) : []),
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
  // `_email` is unused and kept only so existing callers compile; the server uses the Bearer token.
  async fetchMyCourses(_email?: string): Promise<ApiResponse<Course[]>> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.MY_COURSES);
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

  /**
   * Fetch Course Reviews & Rating Breakdown
   */
  async fetchCourseReviews(courseId?: string): Promise<ApiResponse<{
    success: boolean;
    course_id?: number | string;
    course_title?: string;
    average_rating?: number;
    reviews_count?: number;
    satisfaction_pct?: number;
    rating_breakdown?: { [key: string]: number };
    reviews: CourseReviewItem[];
  }>> {
    return apiClient.get(API_CONFIG.ENDPOINTS.COURSE_REVIEWS(courseId));
  },

  /**
   * Submit Course Review
   */
  async submitCourseReview(payload: {
    course_id: string | number;
    rating: number;
    title?: string;
    content: string;
    author_name?: string;
    author_email?: string;
  }): Promise<ApiResponse<{ success: boolean; message: string; review?: CourseReviewItem }>> {
    return apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_REVIEW, payload);
  },

  /**
   * Fetch Course Q&A items
   */
  async fetchCourseQA(courseId: string): Promise<ApiResponse<{
    success: boolean;
    course_id: number | string;
    count: number;
    qa_items: CourseQAItem[];
  }>> {
    return apiClient.get(API_CONFIG.ENDPOINTS.COURSE_QA(courseId));
  },

  /**
   * Submit Course Question
   */
  async submitCourseQuestion(payload: {
    course_id: string | number;
    question: string;
  }): Promise<ApiResponse<{ success: boolean; message: string; qa_item?: CourseQAItem }>> {
    // Requires the Bearer token (401 for guests). The server credits the question to the signed-in account.
    return apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_QUESTION, payload);
  },

  /**
   * Reply to a student question. Requires the Bearer token (401 for guests).
   */
  async replyToCourseQuestion(payload: {
    question_id: number;
    reply: string;
  }): Promise<ApiResponse<{ success: boolean; message: string; answered: boolean; reply?: CourseQAReply }>> {
    return apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_QA_REPLY, payload);
  },

  /**
   * Fetch Student Earned Certificates
   */
  // `_params` is unused and kept only so existing callers compile; the server uses the Bearer token.
  async fetchMyCertificates(_params?: { user_id?: number | string; email?: string }): Promise<ApiResponse<{
    success: boolean;
    student_name: string;
    count: number;
    certificates: CertificateItem[];
  }>> {
    return apiClient.get(API_CONFIG.ENDPOINTS.MY_CERTIFICATES);
  },

  /**
   * Verify an official certificate code
   */
  async verifyCertificate(code: string): Promise<ApiResponse<{
    success: boolean;
    valid: boolean;
    verification_code?: string;
    student_name?: string;
    course_title?: string;
    issuer?: string;
    status?: string;
    verification_url?: string;
    error?: string;
  }>> {
    return apiClient.get(API_CONFIG.ENDPOINTS.VERIFY_CERTIFICATE(code));
  },
};
