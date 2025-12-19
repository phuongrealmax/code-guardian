/**
 * Unit tests for Policy Pack Signature utilities
 *
 * @module tests/unit/policy-pack/signature
 */

import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  signPolicy,
  verifyPolicySignature,
  isSigned,
  getPolicyFingerprint,
  computePolicyHash,
  canonicalize,
  sha256,
  isTrustedPolicy,
} from '../../../src/modules/policy-pack/signature.js';
import type { PolicyPack } from '../../../src/modules/policy-pack/policy-pack.types.js';

describe('Signature Utilities', () => {
  const createTestPolicy = (): PolicyPack => ({
    name: 'test-policy',
    version: '1.0.0',
    rules: {
      tdi: { maxBudget: 50, failOnExceed: true },
    },
  });

  describe('canonicalize', () => {
    it('should sort object keys alphabetically', () => {
      const input = { z: 1, a: 2, m: 3 };
      const result = canonicalize(input);
      expect(result).toBe('{"a":2,"m":3,"z":1}');
    });

    it('should handle nested objects', () => {
      const input = { outer: { z: 1, a: 2 }, inner: 3 };
      const result = canonicalize(input);
      expect(result).toBe('{"inner":3,"outer":{"a":2,"z":1}}');
    });

    it('should handle arrays', () => {
      const input = { arr: [3, 1, 2] };
      const result = canonicalize(input);
      expect(result).toBe('{"arr":[3,1,2]}');
    });

    it('should handle null values', () => {
      const input = { a: null, b: 1 };
      const result = canonicalize(input);
      expect(result).toBe('{"a":null,"b":1}');
    });
  });

  describe('sha256', () => {
    it('should compute correct SHA-256 hash', () => {
      const hash = sha256('hello');
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('world');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('computePolicyHash', () => {
    it('should compute hash excluding integrity field', () => {
      const policy1 = createTestPolicy();
      const policy2: PolicyPack = {
        ...policy1,
        integrity: {
          hashAlgorithm: 'SHA-256',
          signatureAlgorithm: 'Ed25519',
          signature: 'some-signature',
        },
      };

      const hash1 = computePolicyHash(policy1);
      const hash2 = computePolicyHash(policy2);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different policies', () => {
      const policy1 = createTestPolicy();
      const policy2: PolicyPack = { ...policy1, version: '2.0.0' };

      const hash1 = computePolicyHash(policy1);
      const hash2 = computePolicyHash(policy2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateKeyPair', () => {
    it('should generate valid Ed25519 key pair', () => {
      const keyPair = generateKeyPair();

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.length).toBeGreaterThan(0);
      expect(keyPair.privateKey.length).toBeGreaterThan(0);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('signPolicy', () => {
    it('should sign a policy pack', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();

      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      expect(signedPolicy.integrity).toBeDefined();
      expect(signedPolicy.integrity?.signature).toBeDefined();
      expect(signedPolicy.integrity?.signature.length).toBeGreaterThan(0);
      expect(signedPolicy.integrity?.publicKey).toBe(keyPair.publicKey);
      expect(signedPolicy.integrity?.signedAt).toBeDefined();
    });

    it('should preserve original policy fields', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();

      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      expect(signedPolicy.name).toBe(policy.name);
      expect(signedPolicy.version).toBe(policy.version);
      expect(signedPolicy.rules).toEqual(policy.rules);
    });
  });

  describe('verifyPolicySignature', () => {
    it('should verify valid signature', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const result = verifyPolicySignature(signedPolicy);

      expect(result.valid).toBe(true);
      expect(result.signedAt).toBeDefined();
    });

    it('should reject tampered policy', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      // Tamper with the policy
      signedPolicy.version = '2.0.0';

      const result = verifyPolicySignature(signedPolicy);

      expect(result.valid).toBe(false);
    });

    it('should reject policy without integrity', () => {
      const policy = createTestPolicy();

      const result = verifyPolicySignature(policy);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('no integrity');
    });

    it('should reject policy without signature', () => {
      const policy: PolicyPack = {
        ...createTestPolicy(),
        integrity: {
          hashAlgorithm: 'SHA-256',
          signatureAlgorithm: 'Ed25519',
          signature: '',
        },
      };

      const result = verifyPolicySignature(policy);

      expect(result.valid).toBe(false);
    });

    it('should reject policy without public key', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      // Remove public key
      delete signedPolicy.integrity!.publicKey;

      const result = verifyPolicySignature(signedPolicy);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('no public key');
    });
  });

  describe('isSigned', () => {
    it('should return true for signed policy', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      expect(isSigned(signedPolicy)).toBe(true);
    });

    it('should return false for unsigned policy', () => {
      const policy = createTestPolicy();

      expect(isSigned(policy)).toBe(false);
    });

    it('should return false for empty signature', () => {
      const policy: PolicyPack = {
        ...createTestPolicy(),
        integrity: {
          hashAlgorithm: 'SHA-256',
          signatureAlgorithm: 'Ed25519',
          signature: '',
        },
      };

      expect(isSigned(policy)).toBe(false);
    });
  });

  describe('getPolicyFingerprint', () => {
    it('should return 16-char fingerprint', () => {
      const policy = createTestPolicy();

      const fingerprint = getPolicyFingerprint(policy);

      expect(fingerprint.length).toBe(16);
    });

    it('should be consistent for same policy', () => {
      const policy = createTestPolicy();

      const fp1 = getPolicyFingerprint(policy);
      const fp2 = getPolicyFingerprint(policy);

      expect(fp1).toBe(fp2);
    });

    it('should be different for different policies', () => {
      const policy1 = createTestPolicy();
      const policy2: PolicyPack = { ...policy1, version: '2.0.0' };

      const fp1 = getPolicyFingerprint(policy1);
      const fp2 = getPolicyFingerprint(policy2);

      expect(fp1).not.toBe(fp2);
    });
  });

  describe('isTrustedPolicy', () => {
    it('should return true for trusted publisher', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const result = isTrustedPolicy(signedPolicy, [keyPair.publicKey]);

      expect(result).toBe(true);
    });

    it('should return false for untrusted publisher', () => {
      const keyPair = generateKeyPair();
      const otherKeyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const result = isTrustedPolicy(signedPolicy, [otherKeyPair.publicKey]);

      expect(result).toBe(false);
    });

    it('should return false for unsigned policy', () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();

      const result = isTrustedPolicy(policy, [keyPair.publicKey]);

      expect(result).toBe(false);
    });
  });
});
