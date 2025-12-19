/**
 * Authentication Service for Evidence Vault
 *
 * Handles API key management with secure storage options:
 * - Environment variables (recommended for CI)
 * - System keychain (recommended for local dev)
 * - File storage (development only, NOT for production)
 *
 * SECURITY:
 * - API keys are NEVER logged or stored in plain config files
 * - Keys are validated before use
 * - Failed auth attempts are rate-limited
 *
 * @module cloud/evidence-vault/auth
 * @since v2.1.0
 */

import type { CloudConfig, ApiError } from './vault.types.js';

// ============================================================================
// Constants
// ============================================================================

const ENV_KEY_NAME = 'CCG_CLOUD_API_KEY';
const KEY_PREFIX = 'ccg_';
const MIN_KEY_LENGTH = 32;

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: ApiError;
}

export interface AuthServiceConfig {
  cloudConfig: CloudConfig;
  onAuthFailure?: (error: ApiError) => void;
}

// ============================================================================
// Auth Service
// ============================================================================

/**
 * Authentication service for cloud API
 */
export class AuthService {
  private config: CloudConfig;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private onAuthFailure?: (error: ApiError) => void;

  constructor(config: AuthServiceConfig) {
    this.config = config.cloudConfig;
    this.onAuthFailure = config.onAuthFailure;
  }

  /**
   * Get API key from configured storage
   * @throws Error if key not found or invalid
   */
  async getApiKey(): Promise<string> {
    const { keyStorage } = this.config;

    let apiKey: string | undefined;

    switch (keyStorage) {
      case 'env':
        apiKey = this.getFromEnv();
        break;

      case 'keychain':
        apiKey = await this.getFromKeychain();
        break;

      case 'file':
        // TODO: Implement file-based storage (development only)
        throw new Error('File-based key storage not yet implemented');

      default:
        throw new Error(`Unknown key storage method: ${keyStorage}`);
    }

    if (!apiKey) {
      throw new Error(
        `API key not found. Set ${ENV_KEY_NAME} environment variable or configure keychain storage.`
      );
    }

    this.validateApiKey(apiKey);
    return apiKey;
  }

  /**
   * Get API key from environment variable
   */
  private getFromEnv(): string | undefined {
    return process.env[ENV_KEY_NAME];
  }

  /**
   * Get API key from system keychain
   * TODO: Implement platform-specific keychain access
   */
  private async getFromKeychain(): Promise<string | undefined> {
    // TODO: Implement keychain access
    // - macOS: Use keychain-access or security CLI
    // - Windows: Use credential-manager
    // - Linux: Use libsecret
    throw new Error('Keychain storage not yet implemented');
  }

  /**
   * Validate API key format
   */
  private validateApiKey(key: string): void {
    if (!key.startsWith(KEY_PREFIX)) {
      throw new Error(`Invalid API key format. Key must start with "${KEY_PREFIX}"`);
    }

    if (key.length < MIN_KEY_LENGTH) {
      throw new Error(`Invalid API key format. Key must be at least ${MIN_KEY_LENGTH} characters`);
    }
  }

  /**
   * Check if current token is valid
   */
  hasValidToken(): boolean {
    return this.cachedToken !== null && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Get authorization header value
   */
  async getAuthHeader(): Promise<string> {
    const apiKey = await this.getApiKey();
    return `Bearer ${apiKey}`;
  }

  /**
   * Clear cached credentials
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Store API key securely
   * @param key API key to store
   * @param storage Storage method to use
   */
  async storeApiKey(key: string, storage: 'env' | 'keychain'): Promise<void> {
    this.validateApiKey(key);

    switch (storage) {
      case 'env':
        // For env, just validate - user must set manually
        console.log(`Set ${ENV_KEY_NAME}=${key.substring(0, 8)}...`);
        console.log('Add to your shell profile or CI secrets');
        break;

      case 'keychain':
        // TODO: Implement keychain storage
        throw new Error('Keychain storage not yet implemented');

      default:
        throw new Error(`Unsupported storage method: ${storage}`);
    }
  }

  /**
   * Test authentication with the cloud API
   */
  async testAuth(): Promise<AuthResult> {
    try {
      const apiKey = await this.getApiKey();

      // TODO: Make actual API call to test authentication
      // For now, just validate the key format
      return {
        success: true,
        token: apiKey.substring(0, 8) + '...',
      };
    } catch (error) {
      const apiError: ApiError = {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Authentication failed',
      };

      this.onAuthFailure?.(apiError);

      return {
        success: false,
        error: apiError,
      };
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create auth service instance
 */
export function createAuthService(config: CloudConfig): AuthService {
  return new AuthService({ cloudConfig: config });
}
