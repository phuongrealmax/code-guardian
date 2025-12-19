// src/modules/proof-pack/integrity.ts
import { createHash } from "node:crypto";

/**
 * Deterministic JSON stringify:
 * - Sort object keys recursively
 * - Keep array order
 * - No whitespace (like JSON.stringify)
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) {
      out[k] = sortDeep(obj[k]);
    }
    return out;
  }
  return value;
}

export type HashAlgorithm = "SHA-256";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Build the canonical string that we hash for a ProofPack:
 * - include everything EXCEPT integrity fields that would self-reference
 */
export function canonicalizeForProofPackHash<T extends Record<string, unknown>>(proofPack: T): string {
  const hashable = structuredCloneSafe(proofPack);

  // Exclude self-referential fields
  delete hashable.hash;
  delete hashable.signature;

  // Keep hashAlgorithm / canonicalization / trustLevel / signatureAlgorithm (if present)
  // because they affect semantics & verification expectations.

  return stableStringify(hashable);
}

export function computeProofPackHash(proofPack: Record<string, unknown>): string {
  const canonical = canonicalizeForProofPackHash(proofPack);
  return sha256Hex(canonical);
}

export function verifyProofPackHash(proofPack: Record<string, unknown>): { ok: boolean; expected: string; actual: string } {
  const actual = String(proofPack.hash ?? "");
  const expected = computeProofPackHash(proofPack);
  return { ok: actual === expected, expected, actual };
}

function structuredCloneSafe<T>(obj: T): T {
  // Node 18+ has structuredClone; fallback to JSON deep clone if needed
  const sc = (globalThis as unknown as { structuredClone?: <U>(x: U) => U }).structuredClone;
  if (typeof sc === "function") return sc(obj);
  return JSON.parse(JSON.stringify(obj)) as T;
}
