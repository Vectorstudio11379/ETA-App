# App ↔ website sync: notes for the app developer

Checked on 2026-11-13 against `inidash/eta-lms-mobile-app`, main branch, commit `ff2ef00`, last pushed 7 Nov. Every endpoint the app calls was tested against the live site.

## Already fixed on the server: no app change needed

| What the app does | What the server now does |
|---|---|
| `fetchBundles()` reads `/bundles` as a plain array | `/bundles` returns a plain array. It used to be `{ success, data }`, which showed 0 bundles in this version of the app. Each bundle has `price`, `originalPrice`, `discount`, `bundleBadge`, `packages`, `description`, `thumbnail`, `course_ids`, and with a token `isEnrolled`. |
| `fetchNotifications()` reads `/notifications` as a plain array | `/notifications` returns a plain array. It was wrapped before, so notifications never showed. |
| `fetchCourses()` maps prices with `Number(item.price \|\| 15000)` | Prices are sent as numeric strings (`"0"`, `"5000"`), so free courses now show ₦0 instead of ₦15,000. Please still change `\|\|` to `??` (see below). |
| Google sign-in posts `{ id_token }` to `/wp-json/lms/v1/google-auth` | That address now exists and returns `{ token, user: { id, name, email, avatar, ... } }`. Errors include `message`. |
| `my-courses` | Each course appears once (it was listed twice: once by course ID, once by product ID). Bundle records and unpublished courses are left out. `progress` is the real % of lessons completed (it used to start at 15%). |
| `updateLessonProgress()` sends `progress_percent` and `position_seconds` | Both are saved and returned by `GET /progress`. A completed lesson stays completed. |
| Buying a bundle | The buyer gets every course in the bundle, the order is attached to their account, and `/bundles` returns `isEnrolled: true` for it. |

## Please change in the app

1. **Push the latest code to GitHub.** The app in our test video has a Discussion/Q&A tab. That code isn't in this repo, so we couldn't check it.
2. **Google sign-in is broken in this code.** `GoogleSigninBtn.tsx` calls `authService.googleLogin()`, but that function is commented out. Call `signInWithGoogle()` from `services/googleAuth.ts` instead, and set `WEB_CLIENT_ID` to the website's web client ID: `1075484270017-tsp0p4e459ki2d57eu8ee311dnv0f0i1.apps.googleusercontent.com`. The server accepts only ID tokens issued for that client.
3. **Price fallbacks.** In `courseService.fetchCourses()`, use `??` instead of `||`, with no invented numbers: `Number(item.price ?? 0)` and `Number(item.originalPrice ?? item.price ?? 0)`. Use the server's `discount` instead of the hard-coded 40%. Do the same for bundles (`|| 20000`, `|| 40000`, `|| 50`).
4. **Invented stats.** `studentsCount || 120`, `rating || 4.8`, `reviewsCount || 35` and `daysLeft || 5` show made-up numbers when the real value is 0. Use `?? 0`, or hide them.
5. **Bundles: show "Purchased"** when `isEnrolled` is `true`. Send the token with `/bundles`; `apiClient` already does this.
6. **Q&A replies** (in the code that isn't pushed): show the Reply button only when `can_reply` is `true`. Built-in FAQs (`type: "faq"`, `id: null`) can't take replies. Label them as FAQs, not as "Student" questions. The reply address is `POST /wp-json/eta/v1/course-qa/reply` with `{ question_id, reply }`.
7. **Don't put the token in the URL.** `fetchEnrolledCourses()` adds `?email=…&auth_token=…`. The server ignores both and uses only the `Authorization` header. A token in a URL ends up in server logs, so remove them.
8. **Old offline data.** `resolveModules()` falls back to `INITIAL_COURSES`, which has old IDs and prices. Use the server's `modules` only.
9. **Free checkout.** If every item in the cart is free, `/checkout/initialize-paystack` returns `free_enrollment: true` with no `authorization_url`. The courses are already unlocked: clear the cart and open My Courses, instead of showing "Failed to initialize Paystack transaction".

Full endpoint reference: `docs/ETA_Mobile_API_Endpoints.md`.
