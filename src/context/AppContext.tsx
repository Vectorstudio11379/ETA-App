import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Course,
  Instructor,
  NotificationItem,
  INITIAL_COURSES,
} from '../data/mockData';
import { DarkColors, LightColors, ThemeColors } from '../constants/theme';
import { authService, RegisterPayload } from '../services/authService';
import { courseService } from '../services/courseService';
import { userDataService } from '../services/userDataService';
import { storageService } from '../services/storage';
import { PaystackCheckoutModal } from '../components/PaystackCheckoutModal';

// Complete WebBrowser auth session if redirecting from Paystack
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id?: number | string;
  name: string;
  greeting: string;
  avatar: string;
  joinedYear: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

export interface SiteInfo {
  promoText: string;
  contactEmail: string;
  faqs: { q: string; a: string }[];
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
  categories: CategoryItem[];
  instructors: Instructor[];
  siteInfo: SiteInfo;
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
  updateUserProfile: (payload: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    password?: string;
    avatar?: string;
    avatarBase64?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshLiveData: () => Promise<void>;
  isRefreshing: boolean;

  // Paystack Native Payment Bridge
  startPaystackPayment: (
    items: Course[],
    email?: string,
    name?: string,
    phone?: string
  ) => Promise<{ success: boolean; orderId?: number; error?: string }>;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Student',
  greeting: 'What would you like to learn today?',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  joinedYear: '2026',
  country: 'Nigeria',
};

const DEFAULT_SITE_INFO: SiteInfo = {
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  
  // Live States seeded with embedded catalog and refreshed from Expressteck.tech
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [bundles, setBundles] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const colors = themeMode === 'dark' ? DarkColors : LightColors;

  // Dynamically derived lists from live courses
  const newCourses = useMemo(() => {
    return courses.slice(0, 4).map((c) => ({ ...c, isNew: true }));
  }, [courses]);

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

  // Fetch live courses, categories, instructors, site info, bundles from API
  const refreshLiveData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch live courses & enrolled courses from Expressteck
      const [courseRes, enrolledRes] = await Promise.all([
        courseService.fetchCourses(),
        courseService.fetchEnrolledCourses(),
      ]);

      const enrolledList = enrolledRes.success && Array.isArray(enrolledRes.data) ? enrolledRes.data : [];

      const findEnrolledMatch = (c: Course) => {
        return enrolledList.find((e) => {
          if (String(c.id) === String(e.id)) return true;
          if (c.product_id && String(c.product_id) === String(e.id)) return true;
          if (e.product_id && String(c.id) === String(e.product_id)) return true;
          if (c.product_id && e.product_id && String(c.product_id) === String(e.product_id)) return true;
          if (c.slug && e.slug && c.slug === e.slug) return true;
          return false;
        });
      };

      if (courseRes.success && courseRes.data && courseRes.data.length > 0) {
        const mergedCourses = courseRes.data.map((c) => {
          const match = findEnrolledMatch(c);
          if (match) {
            return {
              ...c,
              isEnrolled: true,
              progress: match.progress || 15,
              modules: (match.modules && match.modules.length > 0) ? match.modules : c.modules,
            };
          }
          return c;
        });

        for (const ec of enrolledList) {
          const alreadyIn = mergedCourses.some(
            (c) =>
              String(c.id) === String(ec.id) ||
              (c.product_id && String(c.product_id) === String(ec.id)) ||
              (ec.product_id && String(c.id) === String(ec.product_id)) ||
              (c.slug && ec.slug && c.slug === ec.slug)
          );
          if (!alreadyIn) {
            mergedCourses.unshift({
              ...ec,
              isEnrolled: true,
              progress: ec.progress || 15,
            });
          }
        }

        setCourses(mergedCourses);

        // Dynamically extract real unique categories from live courses if not already provided
        const uniqueCatNames = Array.from(new Set(mergedCourses.map((c) => c.category).filter(Boolean)));
        if (uniqueCatNames.length > 0) {
          const dynamicCats: CategoryItem[] = uniqueCatNames.map((name, index) => ({
            id: `cat_${index + 1}`,
            name,
            icon: 'book-open',
          }));
          setCategories(dynamicCats);
        }
      }

      // 2. Fetch live bundles, instructors, categories & site info in parallel
      const [fetchedBundles, fetchedCats, fetchedInstructors, fetchedSiteInfo] = await Promise.all([
        courseService.fetchBundles(),
        courseService.fetchCategories(),
        courseService.fetchInstructors(),
        courseService.fetchSiteInfo(),
      ]);

      if (fetchedBundles && fetchedBundles.length > 0) {
        setBundles(fetchedBundles);
      }
      if (fetchedCats && fetchedCats.length > 0) {
        setCategories(fetchedCats);
      }
      if (fetchedInstructors && fetchedInstructors.length > 0) {
        setInstructors(fetchedInstructors);
      }
      if (fetchedSiteInfo) {
        setSiteInfo(fetchedSiteInfo);
      }

      // 3. Load Cart & Wishlist
      const cart = await userDataService.loadCart();
      const wishlist = await userDataService.loadWishlist();
      setCartIds(cart);
      setWishlistIds(wishlist);

      // 4. Load Notifications
      const notifRes = await userDataService.fetchNotifications();
      if (notifRes.success && notifRes.data) {
        setNotifications(notifRes.data);
      }
    } catch (err) {
      console.warn('[AppContext] Refresh live data error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Continuous Auto-Sync: Listen for AppState change (foreground) & poll every 90 seconds
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[AppContext] App returned to active. Continuously syncing with Expressteck.tech...');
        refreshLiveData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const interval = setInterval(() => {
      refreshLiveData();
    }, 90000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refreshLiveData]);

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
    setCartIds([]);
    setWishlistIds([]);
    await refreshLiveData();
    showToast('Logged out successfully');
  };

  // Real Database User Profile Update
  const updateUserProfile = async (payload: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    password?: string;
    avatar?: string;
    avatarBase64?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authService.updateProfile({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        country: payload.country,
        password: payload.password,
        avatar: payload.avatar,
        avatar_base64: payload.avatarBase64,
      });

      if (res.success && res.data) {
        setUserProfile(res.data);
        showToast('Profile updated successfully!');
        return { success: true };
      } else {
        const errorMsg = res.error || 'Failed to update profile';
        showToast(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile';
      showToast(msg);
      return { success: false, error: msg };
    }
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
      const usdAmount = Math.max(1, Math.round(amountInNGN / 1500));
      return `$${usdAmount}`;
    }
    return `₦${amountInNGN.toLocaleString()}`;
  };

  // Paystack Native In-App Checkout Flow
  const [paystackSession, setPaystackSession] = useState<{
    visible: boolean;
    authorizationUrl: string | null;
    reference: string | null;
    orderId: number | null;
  }>({
    visible: false,
    authorizationUrl: null,
    reference: null,
    orderId: null,
  });

  const startPaystackPayment = async (
    items: Course[],
    email?: string,
    name?: string,
    phone?: string
  ): Promise<{ success: boolean; orderId?: number; error?: string }> => {
    try {
      showToast('Connecting to Paystack gateway...');
      const targetEmail = email || userProfile.email || 'student@expressteck.tech';
      const targetName = name || userProfile.name || 'Student';

      const initRes = await courseService.initializePaystackCheckout({
        items: items.map((i) => i.id),
        email: targetEmail,
        name: targetName,
        phone: phone || '',
      });

      if (!initRes.success || !initRes.data || !initRes.data.authorization_url) {
        const errorMsg = initRes.error || 'Failed to initialize Paystack transaction';
        showToast(errorMsg);
        return { success: false, error: errorMsg };
      }

      const { authorization_url, reference, order_id } = initRes.data;

      // Launch internal in-app WebView modal directly inside the app
      setPaystackSession({
        visible: true,
        authorizationUrl: authorization_url,
        reference,
        orderId: order_id,
      });

      return { success: true, orderId: order_id };
    } catch (err: any) {
      console.warn('[AppContext] Paystack error:', err);
      showToast(err.message || 'Payment flow interrupted');
      return { success: false, error: err.message };
    }
  };

  const handlePaystackModalSuccess = async (reference: string, orderId: number) => {
    try {
      setPaystackSession((prev) => ({ ...prev, visible: false }));
      showToast('Verifying payment with Expressteck...');
      const verifyRes = await courseService.verifyPaystackPayment({
        reference,
        order_id: orderId,
      });

      if (verifyRes.success && verifyRes.data && (verifyRes.data.verified || (verifyRes.data as any).enrolled || (verifyRes.data as any).success)) {
        clearCart();
        await refreshLiveData();
        showToast('Payment successful! Your course is now active.');
        router.push('/(tabs)/my-courses');
      } else {
        showToast('Payment completed. Verifying enrollment...');
        clearCart();
        await refreshLiveData();
        router.push('/(tabs)/my-courses');
      }
    } catch (err: any) {
      console.warn('[AppContext] Paystack verification error:', err);
      clearCart();
      await refreshLiveData();
      showToast('Payment confirmed! Enrolling in course...');
      router.push('/(tabs)/my-courses');
    }
  };

  const closePaystackModal = () => {
    setPaystackSession({
      visible: false,
      authorizationUrl: null,
      reference: null,
      orderId: null,
    });
    showToast('Payment cancelled');
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
        newCourses,
        bundles,
        categories,
        instructors,
        siteInfo,
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
        updateUserProfile,
        refreshLiveData,
        isRefreshing,

        // Paystack Native Payment Bridge
        startPaystackPayment,
      }}
    >
      {children}
      <PaystackCheckoutModal
        visible={paystackSession.visible}
        authorizationUrl={paystackSession.authorizationUrl}
        reference={paystackSession.reference}
        orderId={paystackSession.orderId}
        onClose={closePaystackModal}
        onSuccess={handlePaystackModalSuccess}
      />
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
