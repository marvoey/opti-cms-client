import type {
  ClientConfig,
  RequestOptions,
  ContentItem,
  ApiResponse,
  ErrorResponse,
  PaginatedResponse,
  ApiVersion,
  OAuthCredentials,
  TokenResponse,
} from './types';

export class OptiCmsClient {
  private readonly baseUrl: string;
  private readonly tokenEndpoint: string;
  private readonly timeout: number;
  private readonly version: ApiVersion;
  private readonly autoRefreshToken: boolean;
  private readonly defaultHeaders: Record<string, string>;
  private readonly credentials?: OAuthCredentials;

  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(config: ClientConfig = {}) {
    this.version = config.version ?? 'preview3';
    this.baseUrl = config.baseUrl
      ? config.baseUrl.replace(/\/$/, '')
      : `https://api.cms.optimizely.com/${this.version}`;
    this.tokenEndpoint = config.tokenEndpoint ?? 'https://api.cms.optimizely.com/oauth/token';
    this.timeout = config.timeout ?? 30000;
    this.autoRefreshToken = config.autoRefreshToken ?? true;
    this.credentials = config.credentials;
    this.accessToken = config.accessToken;

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  async authenticate(credentials?: OAuthCredentials): Promise<TokenResponse> {
    const creds = credentials || this.credentials;

    if (!creds) {
      throw new Error('OAuth credentials are required for authentication');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const body: Record<string, string> = {
        grant_type: 'client_credentials',
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      };

      if (creds.actAs) {
        body.act_as = creds.actAs;
      }

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let error: ErrorResponse = {
          type: 'about:blank',
          title: `Authentication failed with status ${response.status}`,
          status: response.status,
        };

        try {
          const errorData = await response.json() as Partial<ErrorResponse>;
          error = {
            type: errorData.type || error.type,
            title: errorData.title || error.title,
            status: errorData.status || error.status,
            instance: errorData.instance,
            details: errorData.details,
            code: errorData.code,
            errors: errorData.errors,
          };
        } catch {
          // If JSON parsing fails, use default error
        }

        throw error;
      }

      const tokenResponse = await response.json() as TokenResponse;
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);

      return tokenResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          type: 'about:blank',
          title: 'Authentication timeout',
          status: 408,
          code: 'TIMEOUT',
        } as ErrorResponse;
      }

      throw error;
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) {
      return true;
    }
    const bufferTime = 30000;
    return Date.now() >= (this.tokenExpiresAt - bufferTime);
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || (this.isTokenExpired() && this.autoRefreshToken)) {
      if (!this.credentials) {
        throw new Error('No access token available and no credentials configured for authentication');
      }
      await this.authenticate();
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestOptions & { method?: string; body?: unknown }
  ): Promise<ApiResponse<T>> {
    await this.ensureAuthenticated();
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const headers = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (options?.method === 'PATCH') {
      headers['Content-Type'] = 'application/merge-patch+json';
    }

    if (options?.etag) {
      headers['If-Match'] = options.etag;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions: RequestInit = {
        method: options?.method || 'GET',
        headers,
        signal: controller.signal,
      };

      if (options?.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url.toString(), fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let error: ErrorResponse = {
          type: 'about:blank',
          title: `Request failed with status ${response.status}`,
          status: response.status,
        };

        try {
          const errorData = await response.json() as Partial<ErrorResponse>;
          error = {
            type: errorData.type || error.type,
            title: errorData.title || error.title,
            status: errorData.status || error.status,
            instance: errorData.instance,
            details: errorData.details,
            code: errorData.code,
            errors: errorData.errors,
          };
        } catch {
          // If JSON parsing fails, use default error
        }

        throw error;
      }

      const etag = response.headers.get('ETag') || undefined;
      const data = await response.json() as T;

      return {
        data,
        status: response.status,
        etag,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          type: 'about:blank',
          title: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        } as ErrorResponse;
      }

      throw error;
    }
  }

  async getContent(
    contentId: string,
    options?: RequestOptions
  ): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>(
      `/experimental/content/${contentId}`,
      options
    );
  }

  async listContent(
    containerKey: string,
    options?: RequestOptions & {
      pageIndex?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<ContentItem>> {
    const params = {
      ...options?.params,
      ...(options?.pageIndex !== undefined && { pageIndex: options.pageIndex }),
      ...(options?.pageSize !== undefined && { pageSize: options.pageSize }),
    };

    const response = await this.request<PaginatedResponse<ContentItem>>(
      `/experimental/content/${containerKey}/items`,
      { ...options, params }
    );
    return response.data;
  }

  async createContent(
    content: Partial<ContentItem>,
    options?: RequestOptions
  ): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>('/content', {
      ...options,
      method: 'POST',
      body: content,
    });
  }

  async updateContent(
    contentId: string,
    updates: Partial<ContentItem>,
    options?: RequestOptions
  ): Promise<ApiResponse<ContentItem>> {
    if (this.version === 'preview2') {
      throw new Error('Use PUT method for preview2. PATCH is only available in preview3.');
    }

    return this.request<ContentItem>(`/content/${contentId}`, {
      ...options,
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteContent(
    contentId: string,
    options?: RequestOptions
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/content/${contentId}`, {
      ...options,
      method: 'DELETE',
    });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getVersion(): ApiVersion {
    return this.version;
  }

  getTokenEndpoint(): string {
    return this.tokenEndpoint;
  }

  hasAccessToken(): boolean {
    return Boolean(this.accessToken);
  }

  hasCredentials(): boolean {
    return Boolean(this.credentials);
  }

  getTokenExpiresAt(): number | undefined {
    return this.tokenExpiresAt;
  }

  setAccessToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    if (expiresIn) {
      this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
    }
  }
}
