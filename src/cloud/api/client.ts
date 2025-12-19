/**
 * HTTP Client for Cloud API
 *
 * Provides a standardized HTTP client with:
 * - Automatic retry with exponential backoff
 * - Request/response logging (sanitized)
 * - Error handling and transformation
 * - Timeout management
 *
 * @module cloud/api/client
 * @since v2.1.0
 */

import type { ApiError, CloudConfig } from '../evidence-vault/vault.types.js';
import type { AuthService } from '../evidence-vault/auth.service.js';

// ============================================================================
// Types
// ============================================================================

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  status: number;
  requestId?: string;
  latencyMs: number;
}

export interface ClientConfig {
  cloudConfig: CloudConfig;
  authService: AuthService;
  userAgent?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// ============================================================================
// HTTP Client
// ============================================================================

/**
 * HTTP client for cloud API requests
 */
export class HttpClient {
  private config: CloudConfig;
  private authService: AuthService;
  private userAgent: string;

  constructor(clientConfig: ClientConfig) {
    this.config = clientConfig.cloudConfig;
    this.authService = clientConfig.authService;
    this.userAgent = clientConfig.userAgent || `CCG-Client/2.1.0`;
  }

  /**
   * Make an API request
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const timeout = options.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT;
    const maxRetries = options.retries ?? DEFAULT_RETRIES;

    let lastError: ApiError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(options, timeout);

        // Success or non-retryable error
        if (response.success || !this.isRetryable(response.status)) {
          return {
            ...response,
            latencyMs: Date.now() - startTime,
          };
        }

        lastError = response.error;
      } catch (error) {
        lastError = this.transformError(error);
      }

      // Wait before retry (if not last attempt)
      if (attempt < maxRetries) {
        await this.delay(RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)]);
      }
    }

    return {
      success: false,
      error: lastError ?? {
        code: 'INTERNAL_ERROR',
        message: 'Request failed after retries',
      },
      status: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T>(
    options: RequestOptions,
    timeout: number
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.endpoint}${options.path}`;
    const authHeader = await this.authService.getAuthHeader();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'User-Agent': this.userAgent,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get('x-request-id') || undefined;

      if (response.ok) {
        const data = (await response.json()) as T;
        return {
          success: true,
          data,
          status: response.status,
          requestId,
          latencyMs: 0,
        };
      }

      // Error response
      const errorBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        success: false,
        error: this.parseErrorResponse(response.status, errorBody),
        status: response.status,
        requestId,
        latencyMs: 0,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if status code is retryable
   */
  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  /**
   * Parse error response body
   */
  private parseErrorResponse(status: number, body: Record<string, unknown>): ApiError {
    if (body.code && body.message) {
      return body as unknown as ApiError;
    }

    // Map HTTP status to error code
    const codeMap: Record<number, ApiError['code']> = {
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
      422: 'VALIDATION_ERROR',
    };

    return {
      code: codeMap[status] || 'INTERNAL_ERROR',
      message: (body.message as string) || `HTTP ${status}`,
      details: body,
    };
  }

  /**
   * Transform caught error to ApiError
   */
  private transformError(error: unknown): ApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          code: 'INTERNAL_ERROR',
          message: 'Request timeout',
        };
      }

      return {
        code: 'INTERNAL_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Unknown error',
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  async get<T>(path: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', path, ...options });
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, ...options });
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, ...options });
  }

  async delete<T>(path: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, ...options });
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create HTTP client instance
 */
export function createHttpClient(config: ClientConfig): HttpClient {
  return new HttpClient(config);
}
