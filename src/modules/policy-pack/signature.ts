/**
 * Ed25519 Signature Utilities for Policy Pack
 *
 * Provides cryptographic signing and verification for Policy Packs
 * using Ed25519 algorithm.
 *
 * @module modules/policy-pack/signature
 * @since v2.1.0
 */

import { createHash, sign, verify, generateKeyPairSync, KeyObject } from 'node:crypto';
import type { PolicyPack, PolicyIntegrity, SignatureVerificationResult } from './policy-pack.types.js';

// ============================================================================
// Constants
// ============================================================================

const HASH_ALGORITHM = 'SHA-256';
const SIGNATURE_ALGORITHM = 'Ed25519';

// ============================================================================
// Key Management
// ============================================================================

/**
 * Ed25519 key pair
 */
export interface Ed25519KeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

/**
 * Generate a new Ed25519 key pair for signing policies
 */
export function generateKeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  return {
    publicKey: publicKey.toString('base64'),
    privateKey: privateKey.toString('base64'),
  };
}

/**
 * Import a public key from base64
 */
export function importPublicKey(base64Key: string): KeyObject {
  const keyBuffer = Buffer.from(base64Key, 'base64');
  return require('node:crypto').createPublicKey({
    key: keyBuffer,
    format: 'der',
    type: 'spki',
  });
}

/**
 * Import a private key from base64
 */
export function importPrivateKey(base64Key: string): KeyObject {
  const keyBuffer = Buffer.from(base64Key, 'base64');
  return require('node:crypto').createPrivateKey({
    key: keyBuffer,
    format: 'der',
    type: 'pkcs8',
  });
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * Recursively sort object keys for canonical JSON
 */
function sortDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortDeep((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Create canonical JSON string for hashing
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

/**
 * Compute SHA-256 hash of a string
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute hash of a policy pack (excluding integrity fields)
 */
export function computePolicyHash(policy: PolicyPack): string {
  const hashable = { ...policy };
  delete hashable.integrity;

  return sha256(canonicalize(hashable));
}

// ============================================================================
// Signing
// ============================================================================

/**
 * Sign a policy pack with Ed25519 private key
 *
 * @param policy - Policy pack to sign
 * @param privateKeyBase64 - Base64-encoded Ed25519 private key
 * @param publicKeyBase64 - Base64-encoded Ed25519 public key (for embedding)
 * @returns Policy pack with integrity field populated
 */
export function signPolicy(
  policy: PolicyPack,
  privateKeyBase64: string,
  publicKeyBase64: string
): PolicyPack {
  // Create hashable version without integrity
  const hashable = { ...policy };
  delete hashable.integrity;

  const canonical = canonicalize(hashable);
  const privateKey = importPrivateKey(privateKeyBase64);

  const signature = sign(null, Buffer.from(canonical, 'utf8'), privateKey);

  const integrity: PolicyIntegrity = {
    hashAlgorithm: 'SHA-256',
    signatureAlgorithm: 'Ed25519',
    signature: signature.toString('base64'),
    publicKey: publicKeyBase64,
    signedAt: new Date().toISOString(),
  };

  return {
    ...policy,
    integrity,
  };
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Verify the signature of a policy pack
 *
 * @param policy - Policy pack with integrity field
 * @returns Verification result
 */
export function verifyPolicySignature(policy: PolicyPack): SignatureVerificationResult {
  if (!policy.integrity) {
    return {
      valid: false,
      error: 'Policy pack has no integrity field',
    };
  }

  if (!policy.integrity.signature) {
    return {
      valid: false,
      error: 'Policy pack has no signature',
    };
  }

  if (!policy.integrity.publicKey) {
    return {
      valid: false,
      error: 'Policy pack has no public key for verification',
    };
  }

  if (policy.integrity.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    return {
      valid: false,
      error: `Unsupported signature algorithm: ${policy.integrity.signatureAlgorithm}`,
    };
  }

  try {
    // Create hashable version without integrity
    const hashable = { ...policy };
    delete hashable.integrity;

    const canonical = canonicalize(hashable);
    const publicKey = importPublicKey(policy.integrity.publicKey);
    const signature = Buffer.from(policy.integrity.signature, 'base64');

    const isValid = verify(null, Buffer.from(canonical, 'utf8'), publicKey, signature);

    if (isValid) {
      return {
        valid: true,
        signer: policy.publisher,
        signedAt: policy.integrity.signedAt,
      };
    }

    return {
      valid: false,
      error: 'Signature verification failed',
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Check if a policy pack has a valid signature from a trusted publisher
 *
 * @param policy - Policy pack to verify
 * @param trustedPublicKeys - List of trusted public keys (base64)
 * @returns Whether the policy is signed by a trusted publisher
 */
export function isTrustedPolicy(policy: PolicyPack, trustedPublicKeys: string[]): boolean {
  if (!policy.integrity?.publicKey) {
    return false;
  }

  // Check if public key is in trusted list
  if (!trustedPublicKeys.includes(policy.integrity.publicKey)) {
    return false;
  }

  // Verify signature
  const result = verifyPolicySignature(policy);
  return result.valid;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create an unsigned policy pack with computed hash
 */
export function createUnsignedPolicy(policy: Omit<PolicyPack, 'integrity'>): PolicyPack {
  return {
    ...policy,
    integrity: {
      hashAlgorithm: 'SHA-256',
      signatureAlgorithm: 'Ed25519',
      signature: '', // Empty = unsigned
    },
  };
}

/**
 * Check if a policy pack is signed
 */
export function isSigned(policy: PolicyPack): boolean {
  return Boolean(policy.integrity?.signature && policy.integrity.signature.length > 0);
}

/**
 * Get policy pack fingerprint (first 16 chars of hash)
 */
export function getPolicyFingerprint(policy: PolicyPack): string {
  return computePolicyHash(policy).substring(0, 16);
}
