import { API_CONFIG, getApiBaseUrl } from '../config/apiConfig';
import { storageService } from './storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export const apiClient = {
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = getApiBaseUrl();

    if (!baseUrl) {
      return {
        success: false,
        error: 'WordPress API URL is not configured.',
      };
    }

    const fullUrl = `${baseUrl}${endpoint}`;
    const token = await storageService.getUserToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-ETA-Auth-Token'] = token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        // WordPress REST API standard error responses: { code, message, data }
        const errorMessage =
          data?.message ||
          data?.error_description ||
          data?.error ||
          `Request failed with status ${response.status}`;

        return {
          success: false,
          error: errorMessage.replace(/<[^>]*>?/gm, ''), // Strip HTML tags if WP returned HTML error
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: data as T,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      return {
        success: false,
        error: isAbort ? 'Network request timed out' : err.message || 'Network request failed',
      };
    }
  },

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
