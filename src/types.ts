export type ApiVersion = 'preview2' | 'preview3';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  actAs?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface ClientConfig {
  baseUrl?: string;
  tokenEndpoint?: string;
  accessToken?: string;
  credentials?: OAuthCredentials;
  timeout?: number;
  headers?: Record<string, string>;
  version?: ApiVersion;
  autoRefreshToken?: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  etag?: string;
}

export interface ContentItem {
  id: string;
  contentType: string;
  name: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalItemCount: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  etag?: string;
}

export interface ValidationError {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  instance?: string;
  details?: string;
  code?: string;
  errors?: ValidationError[];
}
