# Express Tech Academy (ETA) - Complete Mobile REST API Documentation

> **Base Production URL:** `https://expressteck.tech`  
> **API Namespace:** `/wp-json/eta/v1`  
> **Live Server Status:** All endpoints tested, active, and fully verified on the production server.

---

## 1. Authentication & Security Architecture

All authenticated endpoints accept credentials using either of the following headers:
- `Authorization: Bearer <auth_token>`
- `X-ETA-Auth-Token: <auth_token>`

The token is generated upon `/login` or `/register` and persisted in WordPress usermeta under `_eta_app_auth_token`.

---

## 2. Master Summary Table of Endpoints

| Category | Endpoint | Method(s) | Auth Required | Status | Mobile App Integration |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/wp-json/eta/v1/login` | `POST` | No | Verified | `authService.login()` |
| **Auth** | `/wp-json/eta/v1/register` | `POST` | No | Verified | `authService.register()` |
| **Auth** | `/wp-json/eta/v1/auth/forgot-password` | `POST` | No | Verified | `authService.forgotPassword()` |
| **Auth** | `/wp-json/eta/v1/auth/verify-reset-code` | `POST` | No | Verified | `authService.verifyResetCode()` |
| **Auth** | `/wp-json/eta/v1/auth/reset-password` | `POST` | No | Verified | `authService.resetPassword()` |
| **Profile** | `/wp-json/eta/v1/profile` | `GET` | **Yes** | Verified | `authService.getCurrentUser()`, `AppContext` |
| **Profile** | `/wp-json/eta/v1/profile` | `POST`, `PUT` | **Yes** | Verified | `authService.updateProfile()`, `profile-settings.tsx` |
| **Catalog** | `/wp-json/eta/v1/courses` | `GET` | No | Verified | `courseService.fetchCourses()` |
| **Catalog** | `/wp-json/eta/v1/course-details` | `GET` | No | Verified | `courseService.fetchCourseCurriculum()` |
| **Catalog** | `/wp-json/eta/v1/course-curriculum` | `GET` | No | Verified | `courseService.fetchCourseCurriculum()` |
| **Catalog** | `/wp-json/eta/v1/bundles` | `GET` | No | Verified | `courseService.fetchBundles()` |
| **Catalog** | `/wp-json/eta/v1/categories` | `GET` | No | Verified | `courseService.fetchCategories()` |
| **Catalog** | `/wp-json/eta/v1/instructors` | `GET` | No | Verified | `courseService.fetchInstructors()` |
| **Info** | `/wp-json/eta/v1/site-info` | `GET` | No | Verified | `courseService.fetchSiteInfo()` |
| **Student** | `/wp-json/eta/v1/my-courses` | `GET` | Optional (Token/Email) | Verified | `courseService.fetchEnrolledCourses()` |
| **Progress** | `/wp-json/eta/v1/progress` | `GET` | **Yes** | Verified | `courseService.fetchProgress()` |
| **Progress** | `/wp-json/eta/v1/progress` | `POST` | **Yes** | Verified | `courseService.saveLessonProgress()` |
| **Cart** | `/wp-json/eta/v1/cart` | `GET` | Optional | Verified | `userDataService.loadCart()` |
| **Cart** | `/wp-json/eta/v1/cart` | `POST` | Optional | Verified | `userDataService.syncCart()` |
| **Wishlist** | `/wp-json/eta/v1/wishlist` | `GET` | Optional | Verified | `userDataService.loadWishlist()` |
| **Wishlist** | `/wp-json/eta/v1/wishlist` | `POST` | Optional | Verified | `userDataService.syncWishlist()` |
| **Alerts** | `/wp-json/eta/v1/notifications` | `GET` | Optional | Verified | `userDataService.fetchNotifications()` |
| **Payment** | `/wp-json/eta/v1/checkout/initialize-paystack` | `POST` | No | Verified | `courseService.initializePaystackCheckout()` |
| **Payment** | `/wp-json/eta/v1/payment/initialize` | `POST` | No | Verified | Alias for `initialize-paystack` |
| **Payment** | `/wp-json/eta/v1/checkout/verify-paystack` | `GET`, `POST` | No | Verified | `courseService.verifyPaystackPayment()` |
| **Payment** | `/wp-json/eta/v1/payment/verify` | `GET`, `POST` | No | Verified | Alias for `verify-paystack` |
| **Payment** | `/wp-json/eta/v1/payment/status` | `GET` | No | Verified | Payment verification polling |
| **Webhook** | `/wp-json/eta/v1/payment/webhook` | `POST` | No (HMAC Signature) | Verified | Paystack server-to-server webhook |
| **Webhook** | `/wp-json/eta/v1/checkout/paystack-webhook` | `POST` | No (HMAC Signature) | Verified | Paystack server-to-server webhook |
| **Web Route**| `/payment-complete/` | `GET` | No | Verified | In-app WebView deep-link completion redirect |
| **Web Route**| `/mobile-checkout/` | `GET` | No | Verified | Web checkout redirect for mobile |

---

## 3. Detailed Endpoint Specifications

### 3.1 Authentication & Profile

#### `POST /wp-json/eta/v1/register`
Registers a student account and returns an auth token.
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@expressteck.tech",
    "password": "SecurePassword123!",
    "meta": {
      "phone": "+234 810 123 4567",
      "country": "Nigeria"
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "d9f8e7...32chars...",
    "user": {
      "id": 20,
      "name": "Alex Mercer",
      "firstName": "Alex",
      "lastName": "Mercer",
      "email": "alex@expressteck.tech",
      "phone": "+234 810 123 4567",
      "country": "Nigeria",
      "greeting": "What would you like to learn today?",
      "avatar": "https://secure.gravatar.com/avatar/...",
      "joinedYear": "2026",
      "roles": ["subscriber", "masteriyo_student"]
    }
  }
  ```

---

#### `POST /wp-json/eta/v1/login`
Authenticates with email/username and password.
- **Request Body:**
  ```json
  {
    "username": "alex@expressteck.tech",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "d9f8e7...32chars...",
    "user": {
      "id": 20,
      "name": "Alex Mercer",
      "firstName": "Alex",
      "lastName": "Mercer",
      "email": "alex@expressteck.tech",
      "phone": "+234 810 123 4567",
      "country": "Nigeria",
      "greeting": "What would you like to learn today?",
      "avatar": "https://secure.gravatar.com/avatar/...",
      "joinedYear": "2026",
      "roles": ["subscriber", "masteriyo_student"]
    }
  }
  ```

---

#### `POST /wp-json/eta/v1/auth/forgot-password`
Requests a secure 6-digit OTP password reset code sent to student's email.
- **Request Body:**
  ```json
  {
    "email": "alex@expressteck.tech"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "A 6-digit verification code has been sent to your email address.",
    "email": "alex@expressteck.tech"
  }
  ```
- **Error Response (404 Not Found):**
  ```json
  {
    "success": false,
    "error": "No account found with this email address."
  }
  ```

---

#### `POST /wp-json/eta/v1/auth/verify-reset-code`
Pre-validates the 6-digit OTP verification code without resetting password yet.
- **Request Body:**
  ```json
  {
    "email": "alex@expressteck.tech",
    "code": "482019"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verification code is valid."
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Invalid verification code. Please check your email and try again."
  }
  ```

---

#### `POST /wp-json/eta/v1/auth/reset-password`
Verifies OTP code, updates student's password in database, and immediately returns auto-login auth token and profile.
- **Request Body:**
  ```json
  {
    "email": "alex@expressteck.tech",
    "code": "482019",
    "password": "NewSuperPassword2026!"
  }
  ```
- **Response (200 OK - Auto-Login):**
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully.",
    "token": "7a8b9c...32chars...",
    "user": {
      "id": 20,
      "name": "Alex Mercer",
      "firstName": "Alex",
      "lastName": "Mercer",
      "email": "alex@expressteck.tech",
      "phone": "+234 810 123 4567",
      "country": "Nigeria",
      "greeting": "What would you like to learn today?",
      "avatar": "https://expressteck.tech/wp-content/uploads/2026/10/avatar_20_1792596792.png",
      "joinedYear": "2026",
      "roles": ["subscriber", "masteriyo_student"]
    }
  }
  ```

---

#### `GET /wp-json/eta/v1/profile`
Retrieves the logged-in student's live profile details from WordPress.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 20,
      "name": "Alex Mercer",
      "firstName": "Alex",
      "lastName": "Mercer",
      "email": "alex@expressteck.tech",
      "phone": "+234 810 123 4567",
      "country": "Nigeria",
      "greeting": "What would you like to learn today?",
      "avatar": "https://expressteck.tech/wp-content/uploads/2026/10/avatar_20_1792098727.png",
      "joinedYear": "2026",
      "roles": ["subscriber", "masteriyo_student"]
    }
  }
  ```

---

#### `POST` / `PUT /wp-json/eta/v1/profile`
Updates the student's profile information.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Alex Updated Tester",
    "email": "alex_updated@expressteck.tech",
    "phone": "+234 812 999 8877",
    "country": "Nigeria",
    "password": "NewSecurePassword123!",
    "avatar_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "avatar": "https://example.com/custom-avatar.jpg"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "data": {
      "id": 20,
      "name": "Alex Updated Tester",
      "firstName": "Alex",
      "lastName": "Updated Tester",
      "email": "alex_updated@expressteck.tech",
      "phone": "+234 812 999 8877",
      "country": "Nigeria",
      "greeting": "What would you like to learn today?",
      "avatar": "https://expressteck.tech/wp-content/uploads/2026/10/avatar_20_1792098727.png",
      "joinedYear": "2026",
      "roles": ["subscriber", "masteriyo_student"]
    }
  }
  ```

---

### 3.2 User Synced Data (Push / Pull)

#### `GET /wp-json/eta/v1/cart`
Fetches user's saved cart item IDs from WordPress database.
- **Headers:** `Authorization: Bearer <token>` (optional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "cart_ids": ["680", "bundle_1"],
    "data": {
      "cart_ids": ["680", "bundle_1"]
    }
  }
  ```

#### `POST /wp-json/eta/v1/cart`
Saves cart items to user metadata.
- **Request Body:**
  ```json
  {
    "cart_ids": ["680", "bundle_1"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "cart_ids": ["680", "bundle_1"]
  }
  ```

---

#### `GET /wp-json/eta/v1/wishlist`
Fetches user's saved wishlist course IDs from WordPress database.
- **Headers:** `Authorization: Bearer <token>` (optional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "wishlist_ids": ["680"],
    "data": {
      "wishlist_ids": ["680"]
    }
  }
  ```

#### `POST /wp-json/eta/v1/wishlist`
Saves wishlist courses to user metadata.
- **Request Body:**
  ```json
  {
    "wishlist_ids": ["680"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "wishlist_ids": ["680"]
  }
  ```

---

#### `GET /wp-json/eta/v1/notifications`
Returns personalized notifications including Welcome message, course continuation prompts, and platform announcements.
- **Headers:** `Authorization: Bearer <token>` (optional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "notif_welcome",
        "title": "Welcome to Express Tech Academy!",
        "message": "Hi Alex Updated Tester, explore our industry-certified engineering & tech courses.",
        "time": "Just now",
        "read": false,
        "type": "system",
        "actionUrl": "/(tabs)/explore"
      },
      {
        "id": "notif_study_reminder",
        "title": "Ready to continue learning?",
        "message": "Pick up where you left off in your course.",
        "time": "1 hour ago",
        "read": false,
        "type": "course",
        "actionUrl": "/my-courses"
      },
      {
        "id": "notif_promo",
        "title": "New Flagship Bundles Released",
        "message": "Save up to 70% with our multi-course career track bundles.",
        "time": "Yesterday",
        "read": true,
        "type": "announcement",
        "actionUrl": "/(tabs)/explore"
      }
    ]
  }
  ```

---

### 3.3 Courses & Learning Progress

#### `GET /wp-json/eta/v1/courses`
Returns all published Masteriyo and WooCommerce courses with curriculum structure, prices, ratings, and authors.

#### `GET /wp-json/eta/v1/course-details?id={course_id}`
Returns granular curriculum with video lectures, quiz questions, and practical assignment tasks.

#### `GET /wp-json/eta/v1/my-courses`
Returns all courses currently unlocked/enrolled for the student with completion progress percentages.

#### `GET /wp-json/eta/v1/progress` & `POST /wp-json/eta/v1/progress`
Fetches and records completed lesson IDs, quiz scores, and timestamps.
- **POST Body:**
  ```json
  {
    "course_id": "680",
    "lesson_id": "les_1_1",
    "completed": true,
    "score": 100
  }
  ```

---

### 3.4 Payments & Paystack Auto-Enrollment

#### `POST /wp-json/eta/v1/checkout/initialize-paystack`
Initializes Paystack transaction for course(s) and creates pending WooCommerce order.
- **Request Body:**
  ```json
  {
    "items": ["680"],
    "email": "alex@expressteck.tech",
    "name": "Alex Mercer",
    "phone": "+2348123456789"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "authorization_url": "https://checkout.paystack.com/xxxxxx",
    "reference": "ETA_ORD_742_1792098000",
    "order_id": 742,
    "amount": 1500000
  }
  ```

#### `GET` / `POST /wp-json/eta/v1/checkout/verify-paystack`
Verifies Paystack transaction, marks order complete, and auto-enrolls student into Masteriyo LMS.
- **Query / Body:** `?reference=ETA_ORD_742_1792098000`

---

## 4. Mobile App Integration File Map

| Purpose | Mobile App Source File | Endpoints Invoked |
| :--- | :--- | :--- |
| **API Base & Endpoints** | `ETA App/src/config/apiConfig.ts` | All `/wp-json/eta/v1/*` constants |
| **HTTP Client & Auth Injection** | `ETA App/src/services/apiClient.ts` | Attaches `Bearer <token>` & `X-ETA-Auth-Token` |
| **Auth & Profile Service** | `ETA App/src/services/authService.ts` | `/login`, `/register`, `/profile` |
| **Course Catalog & Progress** | `ETA App/src/services/courseService.ts` | `/courses`, `/bundles`, `/course-details`, `/progress` |
| **Cart, Wishlist & Notifications** | `ETA App/src/services/userDataService.ts` | `/cart`, `/wishlist`, `/notifications` |
| **App State Provider** | `ETA App/src/context/AppContext.tsx` | Provides `updateUserProfile`, `login`, `signup`, `syncCart` |
| **Profile Settings Screen** | `ETA App/src/app/profile-settings.tsx` | UI form with `expo-image-picker` & backend sync |
| **Profile Tab Screen** | `ETA App/src/app/(tabs)/profile.tsx` | Displays user details, avatar, and navigation |
