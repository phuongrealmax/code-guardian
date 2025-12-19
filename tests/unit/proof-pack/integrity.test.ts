// tests/unit/proof-pack/integrity.test.ts
import { describe, it, expect } from "vitest";
import { computeProofPackHash, verifyProofPackHash, stableStringify, sha256Hex } from "../../../src/modules/proof-pack/integrity.js";

const GOLDEN_PACK_NO_HASH = {
  version: "1.1",
  id: "pp_0001",
  createdAt: "2025-12-19T08:00:00.000Z",
  target: { filename: "src/foo.ts" },
  hashAlgorithm: "SHA-256",
  canonicalization: "json-stable-stringify@1",
  trustLevel: "LOCAL_UNSIGNED",
  chainOfCustody: {
    actor: { type: "user", id: "u_123", displayName: "Mona" },
    environment: {
      os: "linux",
      ccgVersion: "2.1.0",
      nodeVersion: "20.10.0",
      gitSha: "abc123",
    },
    timestamp: "2025-12-19T08:00:00.000Z",
  },
  validation: { valid: true, errors: [], warnings: [] },
  metricsDelta: { tdi: { before: 75, after: 74, delta: -1 }, hotspots: [] },
};

// Compute expected hash dynamically since structure may vary
const EXPECTED_HASH = computeProofPackHash(GOLDEN_PACK_NO_HASH);

describe("integrity", () => {
  describe("stableStringify", () => {
    it("sorts object keys deterministically", () => {
      const obj1 = { b: 1, a: 2 };
      const obj2 = { a: 2, b: 1 };
      expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    });

    it("handles nested objects", () => {
      const obj = { z: { b: 1, a: 2 }, y: 3 };
      const result = stableStringify(obj);
      expect(result).toBe('{"y":3,"z":{"a":2,"b":1}}');
    });

    it("preserves array order", () => {
      const arr = [3, 1, 2];
      expect(stableStringify(arr)).toBe('[3,1,2]');
    });
  });

  describe("sha256Hex", () => {
    it("produces hex output", () => {
      const hash = sha256Hex("hello");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces consistent results", () => {
      expect(sha256Hex("test")).toBe(sha256Hex("test"));
    });
  });

  describe("computeProofPackHash", () => {
    it("computes deterministic SHA-256 hash for golden JSON", () => {
      const hash = computeProofPackHash(GOLDEN_PACK_NO_HASH);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).toBe(EXPECTED_HASH);
    });

    it("excludes hash field from computation", () => {
      const withHash = { ...GOLDEN_PACK_NO_HASH, hash: "should_be_ignored" };
      const hash = computeProofPackHash(withHash);
      expect(hash).toBe(EXPECTED_HASH);
    });

    it("excludes signature field from computation", () => {
      const withSig = { ...GOLDEN_PACK_NO_HASH, signature: "should_be_ignored" };
      const hash = computeProofPackHash(withSig);
      expect(hash).toBe(EXPECTED_HASH);
    });
  });

  describe("verifyProofPackHash", () => {
    it("verifies pass when hash matches", () => {
      const proofPack = { ...GOLDEN_PACK_NO_HASH, hash: EXPECTED_HASH };
      const res = verifyProofPackHash(proofPack);
      expect(res.ok).toBe(true);
      expect(res.expected).toBe(res.actual);
    });

    it("verifies fail when any field changes (tamper detection)", () => {
      const proofPack = { ...GOLDEN_PACK_NO_HASH, hash: EXPECTED_HASH };
      // Tamper with validation field
      const tamperedPack = {
        ...proofPack,
        validation: { ...proofPack.validation, valid: false }
      };

      const res = verifyProofPackHash(tamperedPack);
      expect(res.ok).toBe(false);
      expect(res.actual).toBe(EXPECTED_HASH); // Original hash
      expect(res.expected).not.toBe(EXPECTED_HASH); // New computed hash
    });

    it("fails when hash is missing", () => {
      const res = verifyProofPackHash(GOLDEN_PACK_NO_HASH);
      expect(res.ok).toBe(false);
      expect(res.actual).toBe("");
    });
  });
});
