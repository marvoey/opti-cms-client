import type {
  ClientConfig,
  RequestOptions,
  ContentItem,
  ApiResponse,
  ErrorResponse,
} from './types';

export class OptiCmsClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (this.apiKey) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ErrorResponse = {
          message: `Request failed with status ${response.status}`,
          status: response.status,
        };

        try {
          const errorData = await response.json();
          error.message = errorData.message || error.message;
          error.code = errorData.code;
        } catch {
          // If JSON parsing fails, use default error message
        }

        throw error;
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
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
  ): Promise<ContentItem> {
    const response = await this.request<ContentItem>(
      `/content/${contentId}`,
      options
    );
    return response.data;
  }

  async listContent(options?: RequestOptions): Promise<ContentItem[]> {
    const response = await this.request<ContentItem[]>('/content', options);
    return response.data;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }
}
