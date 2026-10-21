import { API_CONFIG } from '../config/apiConfig';
import { apiClient, ApiResponse } from './apiClient';
import { storageService } from './storage';
import { UserProfile } from '../context/AppContext';

export interface LoginResult {
  token: string;
  user: UserProfile;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  country?: string;
}

export const authService = {
  /**
   * Log in user with Expressteck WordPress API
   */
  async login(usernameOrEmail: string, password: string): Promise<ApiResponse<LoginResult>> {
    // 1. Try ETA API Bridge Endpoint (/wp-json/eta/v1/login)
    let res = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
      username: usernameOrEmail,
      password,
    });

    // 2. Fallback to JWT Plugin Endpoint (/wp-json/jwt-auth/v1/token) if ETA plugin not activated yet
    if (!res.success && res.statusCode === 404) {
      res = await apiClient.post(API_CONFIG.ENDPOINTS.JWT_LOGIN_FALLBACK, {
        username: usernameOrEmail,
        password,
      });
    }

    if (!res.success || (!res.data?.token && !res.data?.user)) {
      return {
        success: false,
        error: res.error || 'Invalid credentials or failed to log in.',
      };
    }

    const token = res.data.token || res.data.data?.token || `token_${Date.now()}`;
    await storageService.setUserToken(token);

    const userObj = res.data.user || {};
    const userProfile: UserProfile = {
      id: userObj.id,
      name: userObj.name || usernameOrEmail,
      greeting: userObj.greeting || 'What would you like to learn today?',
      avatar: userObj.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      joinedYear: userObj.joinedYear || new Date().getFullYear().toString(),
      country: userObj.country || 'Nigeria',
      email: userObj.email || (usernameOrEmail.includes('@') ? usernameOrEmail : undefined),
      phone: userObj.phone,
    };

    await storageService.setItem(storageService.STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));

    return {
      success: true,
      data: {
        token,
        user: userProfile,
      },
    };
  },

  /**
   * Register a new user on Expressteck WordPress
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<LoginResult>> {
    let res = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
      name: payload.fullName,
      email: payload.email,
      password: payload.password,
      meta: {
        phone: payload.phone,
        country: payload.country,
      },
    });

    if (!res.success) {
      return {
        success: false,
        error: res.error || 'Registration failed.',
      };
    }

    return this.login(payload.email, payload.password);
  },

  /**
   * Get Logged-in User Profile from WordPress
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    // 1. Fetch live user profile from WordPress
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE);
    if (res.success && res.data) {
      const u = res.data.data || res.data.user || res.data;
      const profile: UserProfile = {
        id: u.id,
        name: u.name || 'Student',
        greeting: u.greeting || 'What would you like to learn today?',
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        joinedYear: u.joinedYear || '2026',
        country: u.country || 'Nigeria',
        email: u.email,
        phone: u.phone,
      };

      await storageService.setItem(storageService.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return { success: true, data: profile };
    }

    // 2. Fallback to cached local profile
    const stored = await storageService.getItem(storageService.STORAGE_KEYS.USER_PROFILE);
    if (stored) {
      try {
        return { success: true, data: JSON.parse(stored) };
      } catch (e) {
        // Fallback
      }
    }

    return {
      success: false,
      error: res.error || 'Failed to load user profile.',
    };
  },

  /**
   * Update Logged-in User Profile (Name, Email, Phone, Country, Password, Avatar)
   */
  async updateProfile(payload: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    password?: string;
    avatar?: string;
    avatar_base64?: string;
  }): Promise<ApiResponse<UserProfile>> {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, payload);
    if (!res.success) {
      return {
        success: false,
        error: res.error || 'Failed to update profile.',
      };
    }

    const u = res.data?.data || res.data?.user || res.data;
    const profile: UserProfile = {
      id: u?.id,
      name: u?.name || 'Student',
      greeting: u?.greeting || 'What would you like to learn today?',
      avatar: u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      joinedYear: u?.joinedYear || '2026',
      country: u?.country || 'Nigeria',
      email: u?.email,
      phone: u?.phone,
    };

    await storageService.setItem(storageService.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return { success: true, data: profile };
  },

  /**
   * Request 6-digit OTP code to email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, { email });
    if (res.success) {
      return { success: true, message: res.data?.message || 'Verification code sent.' };
    }
    return { success: false, error: res.error || 'Failed to send reset code.' };
  },

  /**
   * Pre-verify 6-digit OTP code
   */
  async verifyResetCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.VERIFY_RESET_CODE, { email, code });
    if (res.success) {
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid verification code.' };
  },

  /**
   * Reset Password & Auto-Login
   */
  async resetPassword(email: string, code: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: UserProfile;
    error?: string;
  }> {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
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
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        joinedYear: u.joinedYear || '2026',
        country: u.country || 'Nigeria',
        email: u.email,
        phone: u.phone,
      };

      await storageService.setUserToken(token);
      await storageService.setItem(storageService.STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));

      return { success: true, token, user: userProfile };
    }

    return { success: false, error: res.error || 'Failed to reset password.' };
  },

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    await storageService.clearUserSession();
  },
};
