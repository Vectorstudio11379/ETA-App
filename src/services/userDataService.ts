import { API_CONFIG } from '../config/apiConfig';
import { apiClient, ApiResponse } from './apiClient';
import { NotificationItem } from '../data/mockData';
import { storageService } from './storage';

export const userDataService = {
  /**
   * Sync & fetch cart items
   */
  async syncCart(cartIds: string[]): Promise<void> {
    await storageService.setItem(storageService.STORAGE_KEYS.CART_IDS, JSON.stringify(cartIds));

    if (API_CONFIG.WORDPRESS_URL) {
      await apiClient.post(API_CONFIG.ENDPOINTS.USER_CART, { cart_ids: cartIds });
    }
  },

  async loadCart(): Promise<string[]> {
    if (API_CONFIG.WORDPRESS_URL) {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_CART);
      if (res.success && Array.isArray(res.data?.cart_ids)) {
        return res.data.cart_ids;
      }
    }
    const stored = await storageService.getItem(storageService.STORAGE_KEYS.CART_IDS);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Sync & fetch wishlist items
   */
  async syncWishlist(wishlistIds: string[]): Promise<void> {
    await storageService.setItem(storageService.STORAGE_KEYS.WISHLIST_IDS, JSON.stringify(wishlistIds));

    if (API_CONFIG.WORDPRESS_URL) {
      await apiClient.post(API_CONFIG.ENDPOINTS.USER_WISHLIST, { wishlist_ids: wishlistIds });
    }
  },

  async loadWishlist(): Promise<string[]> {
    if (API_CONFIG.WORDPRESS_URL) {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_WISHLIST);
      if (res.success && Array.isArray(res.data?.wishlist_ids)) {
        return res.data.wishlist_ids;
      }
    }
    const stored = await storageService.getItem(storageService.STORAGE_KEYS.WISHLIST_IDS);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Fetch User Notifications
   */
  async fetchNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    if (API_CONFIG.WORDPRESS_URL) {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.USER_NOTIFICATIONS);
      if (res.success && Array.isArray(res.data)) {
        return { success: true, data: res.data };
      }
    }
    return { success: true, data: [] };
  },
};
