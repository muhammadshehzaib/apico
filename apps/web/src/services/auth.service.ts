import { apiService } from './api.service';
import { API_ENDPOINTS, TOKEN_KEYS } from '@/constants/api.constants';
import { AuthTokens, User } from '@/types';
import { LoginInput, RegisterInput } from '@/validations/auth.validation';

class AuthService {
  async register(input: RegisterInput): Promise<AuthTokens> {
    const response = await apiService.post<AuthTokens>(API_ENDPOINTS.REGISTER, input);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    return response.data;
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const response = await apiService.post<AuthTokens>(API_ENDPOINTS.LOGIN, input);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
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
