// src/modules/proof-pack/proof-pack.tools.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  ProofPack,
  ProofPackCreateInput,
  ProofPackVerifyResult,
  ProofTrustLevel,
  ProofActor,
  ProofEnvironment,
  MetricsDelta,
} from "./proof-pack.types.js";
import { ProofPackService } from "./proof-pack.service.js";

/**
 * Minimal MCP tool definition (adapt to your existing tool registry)
 */
export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

export type ToolContext = {
  proofPackService: ProofPackService;
  nowISO?: () => string;
  newId?: () => string;
  repoRoot?: string;
  logger?: { info: (...a: unknown[]) => void; warn: (...a: unknown[]) => void; error: (...a: unknown[]) => void };
};

const DEFAULT_INPUT_SCHEMA_CREATE = {
  type: "object",
  additionalProperties: false,
  properties: {
    filename: { type: "string", minLength: 1 },
    validation: {},
    metricsDelta: {},
    actor: {},
    environment: {},
    trustLevel: { type: "string", enum: ["LOCAL_UNSIGNED", "LOCAL_SIGNED", "CI_SIGNED"] },
    id: { type: "string" },
    createdAt: { type: "string" },
    timestamp: { type: "string" },
    signatureAlgorithm: { type: "string", enum: ["Ed25519"] },
    signature: { type: "string", description: "base64 signature (optional in Sprint 1 local runs)" },
    persist: { type: "boolean", default: false },
  },
  required: ["filename", "validation", "metricsDelta", "actor", "environment", "trustLevel"],
};

const DEFAULT_INPUT_SCHEMA_VERIFY = {
  type: "object",
  additionalProperties: false,
  properties: {
    proofPack: {},
    filePath: { type: "string" },
  },
  anyOf: [{ required: ["proofPack"] }, { required: ["filePath"] }],
};

function getNow(ctx: ToolContext): string {
  return ctx.nowISO ? ctx.nowISO() : new Date().toISOString();
}

function getId(ctx: ToolContext): string {
  return ctx.newId ? ctx.newId() : `pp_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function assertBasicCreateArgs(args: Record<string, unknown>): void {
  if (!args || typeof args !== "object") throw new Error("Invalid args");
  if (!args.filename || typeof args.filename !== "string") throw new Error("filename is required");
  if (!args.actor || typeof args.actor !== "object") throw new Error("actor is required");
  if (!args.environment || typeof args.environment !== "object") throw new Error("environment is required");
  if (!args.metricsDelta || typeof args.metricsDelta !== "object") throw new Error("metricsDelta is required");
  if (!args.trustLevel || typeof args.trustLevel !== "string") throw new Error("trustLevel is required");
}

function normalizeTrustLevel(v: unknown): ProofTrustLevel {
  if (v === "LOCAL_UNSIGNED" || v === "LOCAL_SIGNED" || v === "CI_SIGNED") return v;
  throw new Error("trustLevel must be one of LOCAL_UNSIGNED | LOCAL_SIGNED | CI_SIGNED");
}

function coerceActor(v: unknown): ProofActor {
  if (!v || typeof v !== "object") throw new Error("actor invalid");
  const obj = v as Record<string, unknown>;
  if (obj.type !== "user" && obj.type !== "ci") throw new Error("actor.type must be user|ci");
  if (!obj.id || typeof obj.id !== "string") throw new Error("actor.id required");
  return { type: obj.type as 'user' | 'ci', id: obj.id, displayName: typeof obj.displayName === "string" ? obj.displayName : undefined };
}

function coerceEnvironment(v: unknown): ProofEnvironment {
  if (!v || typeof v !== "object") throw new Error("environment invalid");
  const obj = v as Record<string, unknown>;
  if (!obj.os || typeof obj.os !== "string") throw new Error("environment.os required");
  if (!obj.ccgVersion || typeof obj.ccgVersion !== "string") throw new Error("environment.ccgVersion required");
  return {
    os: obj.os,
    ccgVersion: obj.ccgVersion,
    runnerId: typeof obj.runnerId === "string" ? obj.runnerId : undefined,
    nodeVersion: typeof obj.nodeVersion === "string" ? obj.nodeVersion : undefined,
    gitSha: typeof obj.gitSha === "string" ? obj.gitSha : undefined,
  };
}

function coerceMetricsDelta(v: unknown): MetricsDelta {
  if (!v || typeof v !== "object") throw new Error("metricsDelta invalid");
  const obj = v as Record<string, unknown>;
  if (!obj.tdi || typeof obj.tdi !== "object") throw new Error("metricsDelta.tdi required");
  return obj as unknown as MetricsDelta;
}

async function persistProofPackIfNeeded(
  ctx: ToolContext,
  pack: ProofPack,
  persist: boolean | undefined
): Promise<{ persisted: boolean; filePath?: string }> {
  if (!persist) return { persisted: false };
  if (!ctx.repoRoot) throw new Error("persist=true requires ctx.repoRoot");
  const dir = path.join(ctx.repoRoot, ".ccg", "proofpacks");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${pack.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(pack, null, 2), "utf8");
  return { persisted: true, filePath };
}

async function loadProofPackFromFile(filePath: string): Promise<ProofPack> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed as ProofPack;
}

/**
 * Export tools for MCP registry
 */
export function getProofPackTools(): ToolDefinition[] {
  return [
    {
      name: "proof_pack_create",
      description:
        "Create a tamper-evident Proof Pack (hash + chain-of-custody). Optionally persist under .ccg/proofpacks/.",
      inputSchema: DEFAULT_INPUT_SCHEMA_CREATE,
      handler: async (args: Record<string, unknown>, ctx: ToolContext) => {
        assertBasicCreateArgs(args);

        const createdAt = typeof args.createdAt === "string" ? args.createdAt : getNow(ctx);
        const id = typeof args.id === "string" ? args.id : getId(ctx);
        const timestamp = typeof args.timestamp === "string" ? args.timestamp : createdAt;

        const input: ProofPackCreateInput = {
          id,
          createdAt,
          filename: args.filename as string,
          actor: coerceActor(args.actor),
          environment: coerceEnvironment(args.environment),
          timestamp,
          validation: args.validation as ProofPackCreateInput['validation'],
          metricsDelta: coerceMetricsDelta(args.metricsDelta),
          trustLevel: normalizeTrustLevel(args.trustLevel),
          signatureAlgorithm: args.signatureAlgorithm === "Ed25519" ? "Ed25519" : undefined,
          signature: typeof args.signature === "string" ? args.signature : undefined,
        };

        const proofPack = await ctx.proofPackService.create(input);
        const persistRes = await persistProofPackIfNeeded(ctx, proofPack, args.persist as boolean | undefined);

        ctx.logger?.info?.("proof_pack_create", { id: proofPack.id, filename: proofPack.target.filename });

        return {
          ok: true,
          proofPack,
          persisted: persistRes.persisted,
          filePath: persistRes.filePath,
        };
      },
    },
    {
      name: "proof_pack_verify",
      description: "Verify a Proof Pack hash (and signature later). Accepts inline proofPack or a filePath.",
      inputSchema: DEFAULT_INPUT_SCHEMA_VERIFY,
      handler: async (args: Record<string, unknown>, ctx: ToolContext) => {
        let proofPack: ProofPack;

        if (args.proofPack) {
          proofPack = args.proofPack as ProofPack;
        } else if (typeof args.filePath === "string") {
          proofPack = await loadProofPackFromFile(args.filePath);
        } else {
          throw new Error("Provide either proofPack or filePath");
        }

        const result: ProofPackVerifyResult = await ctx.proofPackService.verify({ proofPack });

        ctx.logger?.info?.("proof_pack_verify", {
          id: proofPack.id,
          verified: result.verified,
          reason: result.reason,
        });

        return {
          ok: true,
          result,
        };
      },
    },
  ];
}
