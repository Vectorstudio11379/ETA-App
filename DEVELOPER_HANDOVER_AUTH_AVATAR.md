# Express Tech Academy — Frontend Developer Handover Document
## Forgotten Password Flow & Unified Profile Avatar Sync

> **Production Base URL:** `https://expressteck.tech`  
> **API Namespace:** `/wp-json/eta/v1`  
> **Status:** Live, Fully Implemented, and Verified on the Production Server.

---

## 1. Executive Summary

This document specifies the backend contracts and implementation blueprints for the frontend developer to connect:
1. **Native In-App Forgotten Password (6-Digit OTP Flow):**
   - User inputs their email $\rightarrow$ Receives branded ETA 6-digit verification code.
   - User enters the 6-digit code $\rightarrow$ Backend pre-validates the code.
   - User enters their new password $\rightarrow$ Backend resets the password and **immediately returns a fresh auth token and user profile**, auto-logging the student into the app without bouncing them back to a blank login form.
2. **Unified Profile Avatar Database Persistence:**
   - Supports both **Base64 JSON** (`avatar_base64`) and **Multipart/form-data** (`avatar`).
   - Automatically stores the image in the **WordPress Media Library** as an authentic media attachment.
   - Synchronizes across **both** WordPress usermeta (`_eta_app_custom_avatar`) and **Masteriyo LMS** (`_profile_image_id`).
   - Hooks WordPress core `pre_get_avatar_data` so that changing the avatar in the app **instantly updates the website** (`/account/`, course reviews, headers), and vice versa.

---

## 2. Forgotten Password API Endpoints

### 2.1 Step 1: Request Password Reset Code
Triggers a cryptographically generated 6-digit numeric OTP valid for 15 minutes and sends a branded HTML email to the student.

- **Method:** `POST`
- **Endpoint:** `/wp-json/eta/v1/auth/forgot-password` *(or alias `/wp-json/eta/v1/auth/lost-password`)*
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "student@expressteck.tech"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "A 6-digit verification code has been sent to your email address.",
    "email": "student@expressteck.tech"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Please provide your account email address."}`
  - `404 Not Found`: `{"success": false, "error": "No account found with this email address."}`

---

### 2.2 Step 2: Verify 6-Digit Reset Code
Validates that the code entered by the student is correct and has not expired. Use this step to transition the UI to the "New Password" screen.

- **Method:** `POST`
- **Endpoint:** `/wp-json/eta/v1/auth/verify-reset-code`
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "student@expressteck.tech",
    "code": "482019"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Verification code is valid."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Invalid verification code. Please check your email and try again."}`
  - `400 Bad Request`: `{"success": false, "error": "Verification code has expired. Please request a new one."}`
  - `429 Too Many Requests`: `{"success": false, "error": "Too many incorrect attempts. Please request a new verification code."}`

---

### 2.3 Step 3: Set New Password & Instant Auto-Login
Resets the password in the WordPress database, invalidates the OTP code, and **returns an authentication token + user profile** so the student is seamlessly logged in.

- **Method:** `POST`
- **Endpoint:** `/wp-json/eta/v1/auth/reset-password`
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "student@expressteck.tech",
    "code": "482019",
    "password": "NewSecurePassword123!"
  }
  ```
- **Success Response (`200 OK` - Auto-Login):**
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully.",
    "token": "d9f8e7b1a2c3d4e5f6a7b8c9d0e1f2a3",
    "user": {
      "id": 20,
      "name": "Alex Mercer",
      "firstName": "Alex",
      "lastName": "Mercer",
      "email": "student@expressteck.tech",
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

## 3. Profile Avatar Synchronization & Persistence

### 3.1 Overview of Backend Implementation
When a user updates their profile avatar:
1. If uploaded as **Base64** (`avatar_base64`) or **Multipart file** (`avatar`), the backend:
   - Saves the file into `wp-content/uploads/`.
   - Creates a full **WordPress Media Library Attachment** with thumbnail metadata.
   - Saves attachment ID into Masteriyo's user meta: `_profile_image_id`.
   - Saves URL into `_eta_app_custom_avatar`.
2. When the website renders any user avatar (`get_avatar()` or Masteriyo templates), our backend filter intercepts and outputs this image URL.
3. When the mobile app fetches `/wp-json/eta/v1/profile`, it checks both `_eta_app_custom_avatar` and Masteriyo's `_profile_image_id`.

### 3.2 Endpoint: `POST` / `PUT /wp-json/eta/v1/profile`
- **Headers:**
  - `Authorization: Bearer <auth_token>`
  - `Content-Type: application/json` (or `multipart/form-data`)

#### Method A: Base64 JSON (Recommended for React Native / Expo)
```json
{
  "name": "Alex Mercer",
  "avatar_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### Method B: Multipart File Upload
Send standard `multipart/form-data` with:
- Field `avatar` = File binary
- Optional: `name`, `phone`, `country`

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": 20,
    "name": "Alex Mercer",
    "firstName": "Alex",
    "lastName": "Mercer",
    "email": "student@expressteck.tech",
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

## 4. Ready-to-Use Frontend Code (TypeScript / React Native)

### 4.1 Methods to Add to `authService.ts`

```typescript
// Add to authService.ts in the mobile app or frontend web client

export const authService = {
  // ... existing login / register / profile methods ...

  /**
   * 1. Request 6-digit OTP code to email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await apiClient.post('/auth/forgot-password', { email });
    if (res.success) {
      return { success: true, message: res.data?.message || 'Verification code sent.' };
    }
    return { success: false, error: res.error || 'Failed to send reset code.' };
  },

  /**
   * 2. Pre-verify 6-digit OTP code
   */
  async verifyResetCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    const res = await apiClient.post('/auth/verify-reset-code', { email, code });
    if (res.success) {
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid verification code.' };
  },

  /**
   * 3. Reset Password & Auto-Login
   */
  async resetPassword(email: string, code: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: UserProfile;
    error?: string;
  }> {
    const res = await apiClient.post('/auth/reset-password', {
      email,
      code,
      password,
    });

    if (res.success && res.data?.token) {
      const token = res.data.token;
      const u = res.data.user;

      const userProfile: UserProfile = {
        id: u.id,
        name: u.name || 'Student',
        greeting: u.greeting || 'What would you like to learn today?',
        avatar: u.avatar,
        joinedYear: u.joinedYear || '2026',
        country: u.country || 'Nigeria',
        email: u.email,
        phone: u.phone,
      };

      // Persist session
      await storageService.setUserToken(token);
      await storageService.setItem(storageService.STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));

      return { success: true, token, user: userProfile };
    }

    return { success: false, error: res.error || 'Failed to reset password.' };
  },
};
```

### 4.2 Expo / React Native Avatar Picker & Uploader Pattern

```typescript
import * as ImagePicker from 'expo-image-picker';

const handlePickAndUploadAvatar = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert('Permission required to access photos');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    const mime = asset.mimeType || 'image/jpeg';
    const base64Data = `data:${mime};base64,${asset.base64}`;

    // Update profile on live WordPress backend
    const res = await authService.updateProfile({
      avatar_base64: base64Data,
    });

    if (res.success && res.data) {
      // User avatar is now persisted in WordPress Media Library and Masteriyo LMS
      console.log('Avatar persisted:', res.data.avatar);
    }
  }
};
```

---

## 5. Live Verification Proof & Test Commands

You can verify these live endpoints immediately using `curl`:

```bash
# 1. Test Unknown Email (Expects 404)
curl -X POST https://expressteck.tech/wp-json/eta/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com"}'

# 2. Test Real Email (Expects 200 + HTML Email Sent)
curl -X POST https://expressteck.tech/wp-json/eta/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"mobile_test_student@expressteck.tech"}'

# 3. Test Invalid Code (Expects 400)
curl -X POST https://expressteck.tech/wp-json/eta/v1/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"mobile_test_student@expressteck.tech","code":"000000"}'
```
