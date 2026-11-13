# Express Tech Academy Mobile App — Developer Handover & Fix Documentation

This document provides the complete technical breakdown of the bugs identified, their root causes, all updated files, and instructions to rebuild the app.

---

## 1. Summary of Issues & Root Causes

| # | Issue Observed | Root Cause | Fix Applied |
|---|----------------|------------|-------------|
| **1** | Infinite spinner on `Course Details` screen (`Loading course details...`) | `src/app/course/[id].tsx` lacked an active `useEffect` to fetch course details if not found in memory. Additionally, live courses use **Masteriyo Course IDs** (`680`, `660`, `628`, `585`, `572`, `470`, `373`, `343`, `979`), while offline data used **WooCommerce Product IDs** (`704`, `666`, `659`, etc.), and bundles used `bundle_1` – `bundle_4`. Tapping any course or bundle resulted in `course === undefined`. | Added bidirectional alias resolver, pre-seeded `INITIAL_BUNDLES`, added active `useEffect` fetching fallback with retry UI, and bundle child package display. |
| **2** | Bundle + Single Course gave wrong checkout price | `cart.tsx` filtered only `courses` without bundles, and the backend checkout endpoint (`initialize-paystack`) treated `'bundle_1'` as `0` via `intval()`, omitting the bundle price from Paystack's total. | Mapped bundle product IDs (`668`–`671`) in `cart.tsx` and updated the backend catalog in `mobile-api.php` so bundle prices (e.g. ₦20,000) accurately sum with single courses (e.g. ₦9,900) to ₦29,900. |
| **3** | Course progress not working or syncing | Lesson completion toggle was only a dummy local `useState(false)` in `player/[lessonId].tsx`. Progress percentage wasn't persisted or posted to `/wp-json/eta/v1/progress`. | Added `updateLessonProgress(courseId, lessonId, completed)` in `AppContext.tsx`, dynamic recalculation of `course.progress`, optimistic UI update, and synchronization with backend `wp_masteriyo_user_items`. |
| **4** | Metro Warning: `Require cycle: AppContext -> PaystackCheckoutModal -> AppContext` | `PaystackCheckoutModal.tsx` imported `useApp` from `AppContext` merely to read `colors`. | Refactored `PaystackCheckoutModal` to accept `colors?: ThemeColors` (defaulting to `DarkColors`), eliminating the circular dependency. |
| **5** | Metro Error: `Text strings must be rendered within a <Text> component` at `login.tsx` | JSX conditional `{step === 1 && (<View>...)}` evaluated falsy numbers/whitespace into the View tree. | Replaced short-circuit evaluation with explicit ternaries: `{step === 1 ? (<View>...</View>) : null}`. |
| **6** | Warning: `[CoursesService] Live API unreachable or empty` | Large 294 KB JSON response over mobile connections exceeded the old 15s timeout threshold. | Increased `TIMEOUT_MS` to 25s in `apiConfig.ts` and replaced `console.warn` with structured logging. |

---

## 2. Changed Files in `ETA App`

```
ETA App/
├── src/
│   ├── config/
│   │   └── apiConfig.ts                         (Increased TIMEOUT_MS to 25000)
│   ├── data/
│   │   ├── initialBundles.ts                    (NEW: Pre-seeded 4 official bundles)
│   │   └── mockData.ts                          (Re-exports initialBundles)
│   ├── context/
│   │   └── AppContext.tsx                       (Seed bundles, updateLessonProgress, bundle unbundle on clearCart)
│   ├── services/
│   │   └── courseService.ts                     (Preserve bundle product_id, cleaner logging, fallback to initialBundles)
│   ├── components/
│   │   └── PaystackCheckoutModal.tsx            (Break require cycle: accept colors prop instead of importing useApp)
│   └── app/
│       ├── auth/
│       │   └── login.tsx                        (Explicit ternary JSX for steps 1 & 2)
│       ├── cart.tsx                             (Combine courses + bundles + initialCourses in cart resolution)
│       ├── course/
│       │   └── [id].tsx                         (Bidirectional ID/bundle alias matcher, active useEffect fetcher, retry UI)
│       ├── course-viewer/
│       │   └── [id].tsx                         (Bidirectional ID matching & active fetch)
│       └── player/
│           └── [lessonId].tsx                   (Wire completion toggle to updateLessonProgress)
```

---

## 3. Step-by-Step Code Changes

### A. New File: `src/data/initialBundles.ts`
```typescript
import { Course } from './types';

export const INITIAL_BUNDLES: Course[] = [
  {
    id: 'bundle_1',
    product_id: '668',
    slug: 'ai-automation-power-suite',
    title: 'AI & Automation Power Suite',
    instructor: 'Denis Undigiang',
    category: 'Customize & Automate Your Platform',
    originalPrice: 40000,
    price: 20000,
    discount: 50,
    studentsCount: 200,
    rating: 4.9,
    reviewsCount: 45,
    daysLeft: 5,
    isBundle: true,
    bundleBadge: '2 In-1 Power Suite',
    packages: ['666', '627'],
    thumbnail: 'https://expressteck.tech/wp-content/uploads/2026/10/prompt-engineering-thumbnail-1024x572.jpg',
    description: 'The ultimate all-in-one artificial intelligence mastery pack. Master prompt engineering for text, photorealistic image & video generation, plus end-to-end n8n workflow automation and AI agents.',
    isEnrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: 'bundle_2',
    product_id: '669',
    slug: 'digital-creator-social-media-launchpad',
    title: 'Digital Creator & Social Media Launchpad',
    instructor: 'Denis Undigiang',
    category: 'Engage & Retain Your Learners',
    originalPrice: 30000,
    price: 15000,
    discount: 50,
    studentsCount: 180,
    rating: 4.9,
    reviewsCount: 38,
    daysLeft: 5,
    isBundle: true,
    bundleBadge: '2 In-1 Creator Launchpad',
    packages: ['659', '584'],
    thumbnail: 'https://expressteck.tech/wp-content/uploads/2026/10/youtube-masterclass-thumbnail-1024x572.jpg',
    description: 'Everything you need to launch, grow, and monetize as a top-tier digital creator. Covers channel growth, high-CPM global targeting, CapCut editing, viral social strategies, and agency client management.',
    isEnrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: 'bundle_3',
    product_id: '670',
    slug: 'global-remote-career-virtual-assistant-bundle',
    title: 'Global Remote Career & Virtual Assistant Bundle',
    instructor: 'Denis Undigiang',
    category: 'Monetize & Grow Your Academy',
    originalPrice: 35000,
    price: 18000,
    discount: 49,
    studentsCount: 220,
    rating: 4.9,
    reviewsCount: 52,
    daysLeft: 5,
    isBundle: true,
    bundleBadge: '2 In-1 Career Bundle',
    packages: ['466', '496'],
    thumbnail: 'https://expressteck.tech/wp-content/uploads/2026/10/virtual-assistant-masterclass-1024x572.jpg',
    description: 'Step-by-step blueprint to secure high-paying international remote clients and receive foreign payments safely with fully verified overseas PayPal and virtual US/UK bank accounts.',
    isEnrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: 'bundle_4',
    product_id: '671',
    slug: 'financial-freedom-global-trading-mastery',
    title: 'Financial Freedom & Global Trading Mastery',
    instructor: 'Denis Undigiang',
    category: 'Monetize & Grow Your Academy',
    originalPrice: 40000,
    price: 20000,
    discount: 50,
    studentsCount: 195,
    rating: 4.8,
    reviewsCount: 40,
    daysLeft: 5,
    isBundle: true,
    bundleBadge: '2 In-1 Trading Mastery',
    packages: ['467', '496'],
    thumbnail: 'https://expressteck.tech/wp-content/uploads/2026/10/forex-trading-masterclass-1024x572.jpg',
    description: 'Master high-probability currency market analysis, technical price action, institutional risk management, and seamlessly withdraw global earnings through cross-border accounts.',
    isEnrolled: false,
    progress: 0,
    modules: [],
  },
];
```

### B. `src/data/mockData.ts`
Export `INITIAL_BUNDLES`:
```typescript
export * from './types';
export * from './initialCourses';
export * from './initialBundles';
```

### C. `src/components/PaystackCheckoutModal.tsx`
Remove `useApp` and accept `colors?: ThemeColors`:
```typescript
import { ThemeColors, DarkColors } from '../constants/theme';

interface PaystackCheckoutModalProps {
  visible: boolean;
  authorizationUrl: string | null;
  reference: string | null;
  orderId: number | null;
  onClose: () => void;
  onSuccess: (reference: string, orderId: number) => void;
  colors?: ThemeColors;
}

export const PaystackCheckoutModal: React.FC<PaystackCheckoutModalProps> = ({
  visible,
  authorizationUrl,
  reference,
  orderId,
  onClose,
  onSuccess,
  colors = DarkColors,
}) => {
  // Use colors directly without useApp()
...
```

### D. `src/app/course/[id].tsx`
Cross-reference aliases, add active `useEffect` fetcher and bundle UI:
```typescript
// Add bidirectional alias mapping:
const BUNDLE_ALIASES: Record<string, string[]> = {
  'bundle_1': ['bundle_1', '668', 'ai-automation-power-suite'],
  '668': ['bundle_1', '668', 'ai-automation-power-suite'],
  'bundle_2': ['bundle_2', '669', 'digital-creator-social-media-launchpad'],
  '669': ['bundle_2', '669', 'digital-creator-social-media-launchpad'],
  'bundle_3': ['bundle_3', '670', 'global-remote-career-virtual-assistant-bundle'],
  '670': ['bundle_3', '670', 'global-remote-career-virtual-assistant-bundle'],
  'bundle_4': ['bundle_4', '671', 'financial-freedom-global-trading-mastery'],
  '671': ['bundle_4', '671', 'financial-freedom-global-trading-mastery'],
};

const COURSE_ALIASES: Record<string, string[]> = {
  '680': ['680', '704', 'paid-online-survey-masterclass'],
  '704': ['680', '704', 'paid-online-survey-masterclass'],
  '660': ['660', '666', 'prompt-engineering-masterclass'],
  '666': ['660', '666', 'prompt-engineering-masterclass'],
  '628': ['628', '659', 'youtube-masterclass'],
  '659': ['628', '659', 'youtube-masterclass'],
  '585': ['585', '627', '30-day-ai-automation-course'],
  '627': ['585', '627', '30-day-ai-automation-course'],
  '572': ['572', '584', 'complete-social-media-management-course'],
  '584': ['572', '584', 'complete-social-media-management-course'],
  '470': ['470', '496', 'paypal-mastery-course'],
  '496': ['470', '496', 'paypal-mastery-course'],
  '373': ['373', '467', 'complete-forex-trading-course'],
  '467': ['373', '467', 'complete-forex-trading-course'],
  '343': ['343', '466', 'virtual-assistant'],
  '466': ['343', '466', 'virtual-assistant'],
  '979': ['979', '1007', 'graphic-design-masterclass'],
  '1007': ['979', '1007', 'graphic-design-masterclass'],
  '955': ['955', '977', 'content-writing-masterclass'],
  '977': ['955', '977', 'content-writing-masterclass'],
  '954': ['954', '976', 'copywriting-masterclass'],
  '976': ['954', '976', 'copywriting-masterclass'],
};

// Inside CourseDetailScreen:
const allCoursesAndBundles = useMemo(() => {
  return [...courses, ...(bundles || []), ...INITIAL_BUNDLES, ...INITIAL_COURSES];
}, [courses, bundles]);

const resolvedCourse = useMemo(() => {
  return allCoursesAndBundles.find((c) => matchCourse(c, rawId));
}, [allCoursesAndBundles, rawId]);

const [fetchedCourse, setFetchedCourse] = useState<Course | null>(null);

// Active fetch if not found in memory:
useEffect(() => {
  if (!resolvedCourse && rawId) {
    courseService.fetchCourseDetails(rawId).then(res => {
      if (res.success && res.data) setFetchedCourse(res.data);
    });
  }
}, [resolvedCourse, rawId]);
```

### E. `src/context/AppContext.tsx`
1. Initialize bundles with `INITIAL_BUNDLES`:
   ```typescript
   const [bundles, setBundles] = useState<Course[]>(INITIAL_BUNDLES);
   ```
2. Pass `colors={colors}` into `<PaystackCheckoutModal />`:
   ```typescript
   <PaystackCheckoutModal
     visible={paystackSession.visible}
     authorizationUrl={paystackSession.authorizationUrl}
     reference={paystackSession.reference}
     orderId={paystackSession.orderId}
     onClose={closePaystackModal}
     onSuccess={handlePaystackModalSuccess}
     colors={colors}
   />
   ```
3. Add `updateLessonProgress`:
   ```typescript
   const updateLessonProgress = useCallback(
     async (courseId: string, lessonId: string, completed: boolean) => {
       // Optimistic update of lesson.isCompleted and recalculated course.progress
       setCourses((prevCourses) =>
         prevCourses.map((c) => {
           if (String(c.id) !== String(courseId) && String(c.product_id) !== String(courseId)) return c;
           let totalLessons = 0;
           let completedLessons = 0;
           const updatedModules = c.modules?.map((m) => ({
             ...m,
             lessons: m.lessons?.map((l) => {
               totalLessons++;
               const isDone = String(l.id) === String(lessonId) ? completed : Boolean(l.isCompleted);
               if (isDone) completedLessons++;
               return { ...l, isCompleted: isDone };
             }),
           }));
           const newPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
           return { ...c, progress: newPct, modules: updatedModules };
         })
       );

       // Post progress to /wp-json/eta/v1/progress
       try {
         await apiClient.post(API_CONFIG.ENDPOINTS.USER_PROGRESS, {
           course_id: courseId,
           lesson_id: lessonId,
           completed,
         });
       } catch (e) {
         console.warn('[AppContext] Failed to sync lesson progress:', e);
       }
     },
     []
   );
   ```

---

## 4. Backend Endpoints (Already Deployed on Live Server)

The live WordPress endpoints at `https://expressteck.tech` have already been updated:
* **Bundle Catalog (`/wp-json/eta/v1/bundles`)**: Returns all 4 bundles with `product_id` (`668`–`671`) and `course_ids`.
* **Checkout Initialization (`/wp-json/eta/v1/checkout/initialize-paystack`)**: Properly parses bundles and single courses, correctly calculating the exact total in kobo.
* **Progress Tracking (`/wp-json/eta/v1/progress`)**: Synchronizes lesson completion directly with the `wp_masteriyo_user_items` database table.

---

## 5. Verification Commands for Developer

1. **Verify TypeScript compilation (should return 0 errors)**:
   ```bash
   npx tsc --noEmit
   ```
2. **Test locally in Expo Go**:
   ```bash
   npx expo start -c
   ```
3. **Build new Android release / preview build on EAS**:
   ```bash
   eas build --platform android --profile preview
   ```

