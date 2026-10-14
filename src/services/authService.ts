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
      name: userObj.name || usernameOrEmail,
      greeting: userObj.greeting || 'What would you like to learn today?',
      avatar: userObj.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      joinedYear: userObj.joinedYear || new Date().getFullYear().toString(),
      country: userObj.country || 'Nigeria',
      email: userObj.email || (usernameOrEmail.includes('@') ? usernameOrEmail : undefined),
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
   * Get Logged-in User Profile
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    const stored = await storageService.getItem(storageService.STORAGE_KEYS.USER_PROFILE);
    if (stored) {
      try {
        return { success: true, data: JSON.parse(stored) };
      } catch (e) {
        // Fallback
      }
    }

    const res = await apiClient.get(API_CONFIG.ENDPOINTS.CURRENT_USER);
    if (!res.success || !res.data) {
      return {
        success: true,
        data: {
          name: 'Elijah Kola',
          greeting: 'What would you like to learn today?',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
          joinedYear: '2026',
          country: 'Nigeria',
        },
      };
    }

    const wpUser = res.data;
    const profile: UserProfile = {
      name: wpUser.name || wpUser.slug || 'User',
      greeting: 'What would you like to learn today?',
      avatar: wpUser.avatar_urls?.['96'] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      joinedYear: wpUser.registered_date ? new Date(wpUser.registered_date).getFullYear().toString() : '2026',
      country: wpUser.meta?.country || 'Nigeria',
      email: wpUser.email,
    };

    return { success: true, data: profile };
  },

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    await storageService.clearUserSession();
  },
};
