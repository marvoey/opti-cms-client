export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface ContentItem {
  id: string;
  contentType: string;
  name: string;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export interface ErrorResponse {
  message: string;
  status: number;
  code?: string;
}
