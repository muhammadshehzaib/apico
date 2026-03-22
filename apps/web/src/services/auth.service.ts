import { apiService } from './api.service';
import { API_ENDPOINTS, TOKEN_KEYS } from '@/constants/api.constants';
import { AuthTokens, User } from '@/types';
import { LoginInput, RegisterInput } from '@/validations/auth.validation';

class AuthService {
  async register(input: RegisterInput): Promise<AuthTokens | null> {
    const response = await apiService.post<AuthTokens>(API_ENDPOINTS.REGISTER, input);
    console.log(`[AUTH] Register response:`, response.data);
    const { accessToken, refreshToken } = response.data.data || {};

    if (accessToken && refreshToken) {
      console.log(`[AUTH] Saving tokens: ${accessToken.substring(0, 10)}...`);
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
      // Set cookie for server-side checks
      document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      console.warn(`[AUTH] Missing tokens in response!`);
    }

    return response.data.data;
  }

  async login(input: LoginInput): Promise<AuthTokens | null> {
    const response = await apiService.post<AuthTokens>(API_ENDPOINTS.LOGIN, input);
    console.log(`[AUTH] Login response:`, response.data);
    const { accessToken, refreshToken } = response.data.data || {};

    if (accessToken && refreshToken) {
      console.log(`[AUTH] Saving tokens: ${accessToken.substring(0, 10)}...`);
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
      // Set cookie for server-side checks
      document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      console.warn(`[AUTH] Missing tokens in response!`);
    }

    return response.data.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
