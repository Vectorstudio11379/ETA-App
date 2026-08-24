import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Course,
  Instructor,
  NotificationItem,
  MOCK_COURSES,
  MOCK_NEW_COURSES,
  MOCK_BUNDLES,
  MOCK_INSTRUCTORS,
  MOCK_NOTIFICATIONS,
} from '../data/mockData';
import { DarkColors, LightColors, ThemeColors } from '../constants/theme';
import { authService, RegisterPayload } from '../services/authService';
import { courseService } from '../services/courseService';
import { userDataService } from '../services/userDataService';
import { storageService } from '../services/storage';

export interface UserProfile {
  name: string;
  greeting: string;
  avatar: string;
  joinedYear: string;
  country: string;
  email?: string;
}

export interface AppContextType {
  themeMode: 'dark' | 'light';
  colors: ThemeColors;
  toggleThemeMode: () => void;
  currency: 'NGN' | 'USD';
  setCurrency: (c: 'NGN' | 'USD') => void;
  courses: Course[];
  newCourses: Course[];
  bundles: Course[];
  instructors: Instructor[];
  notifications: NotificationItem[];
  cartIds: string[];
  wishlistIds: string[];
  addToCart: (courseId: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  toggleWishlist: (courseId: string) => void;
  formatPrice: (amountInNGN: number) => string;
  userProfile: UserProfile;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Real Database Authentication & Live State Additions
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  userToken: string | null;
  authError: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signup: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshLiveData: () => Promise<void>;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Elijah Kola',
  greeting: 'What would you like to learn today?',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  joinedYear: '2026',
  country: 'Nigeria',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  
  // Database Live States
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [cartIds, setCartIds] = useState<string[]>(['c6']);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['c8']);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const colors = themeMode === 'dark' ? DarkColors : LightColors;

  // Toast feedback helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    showToast(`Switched to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`);
  };

  // Fetch live courses and user data from API / storage
  const refreshLiveData = useCallback(async () => {
    try {
      // 1. Fetch live courses
      const courseRes = await courseService.fetchCourses();
      if (courseRes.success && courseRes.data) {
        setCourses(courseRes.data);
      }

      // 2. Load Cart & Wishlist
      const cart = await userDataService.loadCart();
      const wishlist = await userDataService.loadWishlist();
      setCartIds(cart);
      setWishlistIds(wishlist);

      // 3. Load Notifications
      const notifRes = await userDataService.fetchNotifications();
      if (notifRes.success && notifRes.data) {
        setNotifications(notifRes.data);
      }
    } catch (err) {
      console.warn('[AppContext] Refresh live data error:', err);
    }
  }, []);

  // Restore persistent login session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      try {
        const token = await storageService.getUserToken();
        if (token) {
          setUserToken(token);
          setIsAuthenticated(true);
          const profileRes = await authService.getCurrentUser();
          if (profileRes.success && profileRes.data) {
            setUserProfile(profileRes.data);
          }
        }
      } catch (err) {
        console.warn('[AppContext] Restore auth error:', err);
      } finally {
        setIsLoadingAuth(false);
        await refreshLiveData();
      }
    };

    initializeAuth();
  }, [refreshLiveData]);

  // Real Database Login
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    setAuthError(null);
    const res = await authService.login(usernameOrEmail, password);
    if (res.success && res.data) {
      setUserToken(res.data.token);
      setUserProfile(res.data.user);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${res.data.user.name}!`);
      await refreshLiveData();
      return true;
    } else {
      setAuthError(res.error || 'Failed to log in');
      showToast(res.error || 'Login failed');
      return false;
    }
  };

  // Real Database User Registration
  const signup = async (payload: RegisterPayload): Promise<boolean> => {
    setAuthError(null);
    const res = await authService.register(payload);
    if (res.success && res.data) {
      setUserToken(res.data.token);
      setUserProfile(res.data.user);
      setIsAuthenticated(true);
      showToast(`Account created successfully! Welcome ${res.data.user.name}`);
      await refreshLiveData();
      return true;
    } else {
      setAuthError(res.error || 'Registration failed');
      showToast(res.error || 'Registration failed');
      return false;
    }
  };

  // Real Database Logout
  const logout = async () => {
    await authService.logout();
    setUserToken(null);
    setIsAuthenticated(false);
    setUserProfile(DEFAULT_USER_PROFILE);
    showToast('Logged out successfully');
  };

  // Cart Management with DB Sync
  const addToCart = (courseId: string) => {
    setCartIds((prev) => {
      if (!prev.includes(courseId)) {
        const next = [...prev, courseId];
        userDataService.syncCart(next);
        showToast('Course added to cart');
        return next;
      }
      showToast('Course is already in your cart');
      return prev;
    });
  };

  const removeFromCart = (courseId: string) => {
    setCartIds((prev) => {
      const next = prev.filter((id) => id !== courseId);
      userDataService.syncCart(next);
      showToast('Course removed from cart');
      return next;
    });
  };

  const clearCart = () => {
    setCourses((prevCourses) =>
      prevCourses.map((c) =>
        cartIds.includes(c.id) ? { ...c, isEnrolled: true, progress: 0 } : c
      )
    );
    setCartIds([]);
    userDataService.syncCart([]);
    showToast('Payment successful! Courses added to My Courses');
  };

  // Wishlist Management with DB Sync
  const toggleWishlist = (courseId: string) => {
    setWishlistIds((prev) => {
      const isExist = prev.includes(courseId);
      const next = isExist ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      userDataService.syncWishlist(next);
      showToast(isExist ? 'Removed from favourites' : 'Added to favourites');
      return next;
    });
  };

  const formatPrice = (amountInNGN: number): string => {
    if (currency === 'USD') {
      const usdAmount = Math.round(amountInNGN / 1500);
      return `$${usdAmount}`;
    }
    return `₦${amountInNGN.toLocaleString()}`;
  };

  return (
    <AppContext.Provider
      value={{
        themeMode,
        colors,
        toggleThemeMode,
        currency,
        setCurrency,
        courses,
        newCourses: MOCK_NEW_COURSES,
        bundles: MOCK_BUNDLES,
        instructors: MOCK_INSTRUCTORS,
        notifications,
        cartIds,
        wishlistIds,
        addToCart,
        removeFromCart,
        clearCart,
        toggleWishlist,
        formatPrice,
        userProfile,
        toastMessage,
        showToast,

        // Authentication & Sync Additions
        isAuthenticated,
        isLoadingAuth,
        userToken,
        authError,
        login,
        signup,
        logout,
        refreshLiveData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
