import { Platform } from 'react-native';

let AsyncStorage: any = null;
let isNativeAsyncStorageAvailable = true;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null;
  isNativeAsyncStorageAvailable = false;
}

const STORAGE_KEYS = {
  USER_TOKEN: 'eta_app_user_token',
  USER_PROFILE: 'eta_app_user_profile',
  CART_IDS: 'eta_app_cart_ids',
  WISHLIST_IDS: 'eta_app_wishlist_ids',
  ENROLLED_COURSES: 'eta_app_enrolled_courses',
};

const memoryStore: Record<string, string> = {};

export const storageService = {
  async getItem(key: string): Promise<string | null> {
    // 1. Try AsyncStorage if native module is active
    if (AsyncStorage && isNativeAsyncStorageAvailable) {
      try {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      } catch (err: any) {
        // Disable native AsyncStorage if native module is null in Expo Go / Web
        isNativeAsyncStorageAvailable = false;
      }
    }

    // 2. Try Web localStorage
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        // Fallback
      }
    }

    // 3. Fallback to in-memory store
    return memoryStore[key] || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;

    if (AsyncStorage && isNativeAsyncStorageAvailable) {
      try {
        await AsyncStorage.setItem(key, value);
        return;
      } catch (err: any) {
        isNativeAsyncStorageAvailable = false;
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        // Fallback
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];

    if (AsyncStorage && isNativeAsyncStorageAvailable) {
      try {
        await AsyncStorage.removeItem(key);
        return;
      } catch (err: any) {
        isNativeAsyncStorageAvailable = false;
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Fallback
      }
    }
  },

  // Specialized helpers
  async getUserToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.USER_TOKEN);
  },

  async setUserToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_TOKEN, token);
  },

  async clearUserSession(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_TOKEN);
    await this.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  STORAGE_KEYS: {
    ...STORAGE_KEYS,
    OFFLINE_DOWNLOADS: 'eta_app_offline_downloads',
  },

  // Offline Downloads Sandbox Helpers
  async getOfflineDownloads(): Promise<OfflineDownloadItem[]> {
    const raw = await this.getItem('eta_app_offline_downloads');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async saveOfflineDownload(item: OfflineDownloadItem): Promise<boolean> {
    const list = await this.getOfflineDownloads();
    const existingIndex = list.findIndex((x) => x.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    await this.setItem('eta_app_offline_downloads', JSON.stringify(list));
    return true;
  },

  async removeOfflineDownload(lessonId: string): Promise<void> {
    const list = await this.getOfflineDownloads();
    const filtered = list.filter((x) => x.id !== lessonId);
    await this.setItem('eta_app_offline_downloads', JSON.stringify(filtered));
  },

  async isLessonOffline(lessonId: string): Promise<boolean> {
    const list = await this.getOfflineDownloads();
    return list.some((x) => x.id === lessonId);
  },
};

export interface OfflineDownloadItem {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  duration: string;
  videoUrl?: string;
  thumbnail?: string;
  downloadedAt: string;
  sizeDisplay?: string;
}
