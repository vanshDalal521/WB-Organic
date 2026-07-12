function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000/api/v1";
  }
  return "/api/v1";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getBaseUrl();

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let toastFn: ((type: "success" | "error" | "warning" | "info", message: string) => void) | null = null;

export function registerToastFn(fn: typeof toastFn) {
  toastFn = fn;
}

function showToast(type: "success" | "error" | "warning" | "info", message: string) {
  toastFn?.(type, message);
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_refresh_token");
}

function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("admin_access_token", accessToken);
  localStorage.setItem("admin_refresh_token", refreshToken);
}

function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
}

function redirectLogin() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path !== "/login") {
    window.location.href = "/login";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  isAuthenticated(): boolean {
    return !!getStoredAccessToken();
  }

  async refreshToken(): Promise<boolean> {
    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) return false;

      const data: ApiResponse<RefreshResponse> = await response.json();
      if (data.success && data.data) {
        storeTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async handleRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshToken().finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = getStoredAccessToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && endpoint !== "/auth/refresh") {
      const refreshSuccess = await this.handleRefresh();

      if (refreshSuccess) {
        const newToken = getStoredAccessToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } else {
        clearTokens();
        showToast("error", "Session expired. Please log in again.");
        redirectLogin();
        throw new ApiError("Session expired", 401);
      }

      if (response.status === 401) {
        clearTokens();
        showToast("error", "Session expired. Please log in again.");
        redirectLogin();
        throw new ApiError("Session expired", 401);
      }
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(`Invalid server response (${response.status})`, response.status);
    }

    if (!response.ok) {
      const message = data.message || `Request failed (${response.status})`;

      if (response.status >= 500) {
        showToast("error", "Server error. Please try again later.");
      } else if (response.status === 403) {
        showToast("error", "You do not have permission for this action.");
      } else if (response.status === 404) {
        showToast("error", "Resource not found.");
      } else if (response.status === 400) {
        showToast("error", message);
      }

      throw new ApiError(message, response.status);
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") searchParams.set(key, String(value));
      });
    }
    const qs = searchParams.toString();
    return this.request<T>(`${endpoint}${qs ? `?${qs}` : ""}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const data = await this.post<LoginResponse>("/auth/admin/login", { email, password });
    if (data.success && data.data) {
      storeTokens(data.data.accessToken, data.data.refreshToken);
      showToast("success", "Logged in successfully!");
    }
    return data;
  }

  async logout(): Promise<void> {
    try {
      const token = getStoredAccessToken();
      if (token) {
        await this.post("/auth/logout");
      }
    } catch {
      // ignore logout errors
    } finally {
      clearTokens();
    }
  }

  async getDashboard() {
    return this.get("/admin/dashboard");
  }
  async getCustomers(params?: Record<string, string | number | undefined>) {
    return this.get("/admin/customers", params);
  }
  async getCustomer(id: string) {
    return this.get(`/admin/customers/${id}`);
  }
  async getDeliveryPartners(params?: Record<string, string | number | undefined>) {
    return this.get("/admin/delivery-partners", params);
  }
  async createDeliveryPartner(data: Record<string, unknown>) {
    return this.post("/admin/delivery-partners", data);
  }
  async updateDeliveryPartner(id: string, data: Record<string, unknown>) {
    return this.put(`/admin/delivery-partners/${id}`, data);
  }
  async toggleDeliveryPartner(id: string) {
    return this.patch(`/admin/delivery-partners/${id}/toggle-status`);
  }
  async getProducts(params?: Record<string, string | number | undefined>) {
    return this.get("/products", params);
  }
  async getProduct(id: string) {
    return this.get(`/products/${id}`);
  }
  async createProduct(data: Record<string, unknown>) {
    return this.post("/products", data);
  }
  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.put(`/products/${id}`, data);
  }
  async toggleProduct(id: string) {
    return this.patch(`/products/${id}/toggle-status`);
  }
  async getCategories() {
    return this.get("/products/categories");
  }
  async getOrders(params?: Record<string, string | number | undefined>) {
    return this.get("/admin/orders", params);
  }
  async getOrder(id: string) {
    return this.get(`/admin/orders/${id}`);
  }
  async updateOrderStatus(id: string, status: string, notes?: string) {
    return this.patch(`/admin/orders/${id}/status`, { status, notes });
  }
  async getSubscriptions(params?: Record<string, string | number | undefined>) {
    return this.get("/admin/subscriptions", params);
  }
  async getWalletTransactions(params?: Record<string, string | number | undefined>) {
    return this.get("/wallet/transactions", params);
  }
  async getPublicSettings() {
    return this.get("/settings/public");
  }
  async getAdminSettings(params?: Record<string, string | number | undefined>) {
    return this.get("/settings/admin", params);
  }
  async updateSetting(key: string, value: unknown, category?: string) {
    return this.put(`/settings/admin/${key}`, { value, category });
  }
  async getAuditLogs(params?: Record<string, string | number | undefined>) {
    return this.get("/settings/audit-logs", params);
  }
  async getBanners(params?: Record<string, string | number | undefined>) {
    return this.get("/content/admin/banners", params);
  }
  async createBanner(data: Record<string, unknown>) {
    return this.post("/content/admin/banners", data);
  }
  async updateBanner(id: string, data: Record<string, unknown>) {
    return this.put(`/content/admin/banners/${id}`, data);
  }
  async deleteBanner(id: string) {
    return this.delete(`/content/admin/banners/${id}`);
  }
  async getFarmStories(params?: Record<string, string | number | undefined>) {
    return this.get("/content/admin/farm-stories", params);
  }
  async createFarmStory(data: Record<string, unknown>) {
    return this.post("/content/admin/farm-stories", data);
  }
  async updateFarmStory(id: string, data: Record<string, unknown>) {
    return this.put(`/content/admin/farm-stories/${id}`, data);
  }
  async deleteFarmStory(id: string) {
    return this.delete(`/content/admin/farm-stories/${id}`);
  }
  async getReports(type: string, params?: Record<string, string | number | undefined>) {
    return this.get(`/reports/${type}`, params);
  }
  async getBottleLedger(params?: Record<string, string | number | undefined>) {
    return this.get("/bottles/admin/ledger", params);
  }
  async getBottleTransactions(params?: Record<string, string | number | undefined>) {
    return this.get("/bottles/admin/transactions", params);
  }
  async getAdmins(params?: Record<string, string | number | undefined>) {
    return this.get("/admin/admins", params);
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse, AuthTokens, AdminUser, LoginResponse, RefreshResponse, PaginationMeta };
export default api;