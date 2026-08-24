import { API_CONFIG } from '../config/apiConfig';
import { apiClient, ApiResponse } from './apiClient';
import { Course, MOCK_COURSES } from '../data/mockData';

export const courseService = {
  /**
   * Fetch Live Course Catalog from Expressteck.tech (mto-course / eta-courses / masteriyo)
   */
  async fetchCourses(): Promise<ApiResponse<Course[]>> {
    // 1. Try Live Masteriyo REST API Endpoint (/wp-json/wp/v2/mto-course?_embed=1)
    let res = await apiClient.get(API_CONFIG.ENDPOINTS.MTO_COURSES);

    // 2. Try ETA Plugin REST API (/wp-json/eta/v1/courses) if mto-course empty
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      res = await apiClient.get(API_CONFIG.ENDPOINTS.ETA_COURSES);
    }

    // 3. Fall back to mock courses if server unreachable
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      if (API_CONFIG.ENABLE_MOCK_FALLBACK) {
        console.log('[CourseService] Falling back to local catalog');
        return { success: true, data: MOCK_COURSES };
      }
      return { success: false, error: res.error || 'Failed to fetch courses from Expressteck.tech' };
    }

    // Map Masteriyo WordPress REST API JSON items to app's Course interface
    const courses: Course[] = res.data.map((item: any) => {
      const title = item.title?.rendered || item.title || item.name || 'Untitled Course';
      
      // Parse description text from HTML content
      let rawDesc = item.excerpt?.rendered || item.content?.rendered || item.description || '';
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').replace(/\[&hellip;\]/g, '...').trim();

      // Featured image URL
      const embeddedImage = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      const thumbnail = embeddedImage || item.featured_image || item.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop';

      const regularPrice = Number(item.meta?.regular_price || item.originalPrice || 25000);
      const salePrice = Number(item.meta?.price || item.price || 15000);
      const discountPct = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 35;

      return {
        id: String(item.id),
        title,
        instructor: item._embedded?.author?.[0]?.name || 'Expressteck Instructor',
        category: 'Development',
        originalPrice: regularPrice,
        price: salePrice,
        discount: discountPct,
        studentsCount: 120,
        rating: 4.8,
        reviewsCount: 38,
        daysLeft: 5,
        thumbnail,
        description: cleanDesc,
        isEnrolled: Boolean(item.isEnrolled),
        progress: Number(item.progress || 0),
      };
    });

    console.log(`[CourseService] Successfully fetched ${courses.length} live courses from Expressteck.tech`);
    return { success: true, data: courses };
  },

  /**
   * Fetch user's enrolled courses from Expressteck.tech
   */
  async fetchEnrolledCourses(): Promise<ApiResponse<Course[]>> {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_ENROLLMENTS);
    if (!res.success || !Array.isArray(res.data)) {
      return {
        success: true,
        data: MOCK_COURSES.filter((c) => c.isEnrolled),
      };
    }
    return res;
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
