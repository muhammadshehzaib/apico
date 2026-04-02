import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEYS } from '@/constants/api.constants';
import { ApiResponse } from '@/types';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
      if (token && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Log lack of token for debugging E2E
        console.warn(`[API] No token found for ${config.method?.toUpperCase()} ${config.url}`);
      }
      // Let browser set Content-Type with multipart boundary for FormData
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, data.data.accessToken);

              const config = error.config!;
              config.headers.Authorization = `Bearer ${data.data.accessToken}`;
              return this.instance(config);
            } catch {
              localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
              localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any) {
    return this.instance.get<ApiResponse<T>>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.instance.post<ApiResponse<T>>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.instance.put<ApiResponse<T>>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.instance.patch<ApiResponse<T>>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.instance.delete<ApiResponse<T>>(url, config);
  }
}

export const apiService = new ApiService();
