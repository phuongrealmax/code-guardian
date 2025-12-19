// tests/unit/proof-pack/proof-pack.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../../../src/core/event-bus.js";
import { DefaultProofPackService } from "../../../src/modules/proof-pack/proof-pack.service.js";
import { ProofTrustLevel } from "../../../src/modules/proof-pack/proof-pack.types.js";

describe("ProofPackService", () => {
  let eventBus: EventBus;
  let guard: { validate: ReturnType<typeof vi.fn> };
  let metrics: { compute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    eventBus = new EventBus();
    guard = {
      validate: vi.fn().mockResolvedValue({
        valid: true,
        issues: [],
        blocked: false,
        suggestions: []
      }),
    };
    metrics = {
      compute: vi.fn().mockResolvedValue({
        tdi: { before: 75, after: 75, delta: 0, budgetExceeded: false },
        hotspots: { resolved: 0, added: 0, touched: [] }
      }),
    };
  });

  function createService(trustLevel: ProofTrustLevel = "LOCAL_UNSIGNED") {
    return new DefaultProofPackService({
      eventBus,
      guard,
      metrics,
      now: () => "2025-12-19T08:00:00.000Z",
      id: () => "pp_test",
      trustLevel: () => trustLevel,
    });
  }

  describe("create", () => {
    it("creates a proof pack with correct structure", async () => {
      const service = createService();

      const pack = await service.create({
        id: "pp_x",
        createdAt: "2025-12-19T08:00:00.000Z",
        filename: "src/foo.ts",
        actor: { type: "user", id: "u_123" },
        environment: { os: "linux", ccgVersion: "2.1.0" },
        timestamp: "2025-12-19T08:00:00.000Z",
        validation: { valid: true, issues: [], blocked: false, suggestions: [] },
        metricsDelta: { tdi: { before: 75, after: 74, delta: -1, budgetExceeded: false } },
        trustLevel: "LOCAL_UNSIGNED",
      });

      expect(pack.version).toBe("1.1");
      expect(pack.id).toBe("pp_x");
      expect(pack.target.filename).toBe("src/foo.ts");
      expect(pack.hashAlgorithm).toBe("SHA-256");
      expect(pack.canonicalization).toBe("json-stable-stringify@1");
      expect(pack.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(pack.chainOfCustody.actor.id).toBe("u_123");
    });
  });

  describe("wrapValidation", () => {
    it("returns the exact guard result and emits proofpack:created", async () => {
      const spy = vi.fn();
      eventBus.on("proofpack:created", (event) => spy(event.data));

      const service = createService();

      const out = await service.wrapValidation({
        code: "console.log('hi')",
        filename: "src/foo.ts",
        actor: { type: "user", id: "u_123" },
        environment: { os: "linux", ccgVersion: "2.1.0" },
        sessionId: "s_1",
      });

      expect(out.validationResult).toEqual({
        valid: true,
        issues: [],
        blocked: false,
        suggestions: []
      });
      expect(out.proofPack.id).toBe("pp_test");
      expect(out.proofPack.target.filename).toBe("src/foo.ts");
      expect(out.proofPack.hash).toMatch(/^[0-9a-f]{64}$/);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatchObject({
        proofPackId: "pp_test",
        filename: "src/foo.ts",
        sessionId: "s_1",
      });
    });

    it("calls guard.validate with correct arguments", async () => {
      const service = createService();

      await service.wrapValidation({
        code: "const x = 1;",
        filename: "test.ts",
        validateOptions: { strict: true },
        actor: { type: "user", id: "u_1" },
        environment: { os: "win32", ccgVersion: "2.1.0" },
      });

      expect(guard.validate).toHaveBeenCalledWith(
        "const x = 1;",
        "test.ts",
        { strict: true }
      );
    });

    it("emits proofpack:failed on error", async () => {
      const spy = vi.fn();
      eventBus.on("proofpack:failed", (event) => spy(event.data));

      guard.validate.mockRejectedValue(new Error("Guard failed"));

      const service = createService();

      await expect(
        service.wrapValidation({
          code: "bad code",
          filename: "test.ts",
          actor: { type: "user", id: "u_1" },
          environment: { os: "linux", ccgVersion: "2.1.0" },
          sessionId: "s_2",
        })
      ).rejects.toThrow("Guard failed");

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatchObject({
        stage: "WRAP_VALIDATION",
        errorCode: "WRAP_VALIDATION_FAILED",
        message: "Guard failed",
        filename: "test.ts",
        sessionId: "s_2",
      });
    });
  });

  describe("verify", () => {
    it("returns verified: true for valid pack", async () => {
      const service = createService();

      const pack = await service.create({
        id: "pp_v",
        createdAt: "2025-12-19T08:00:00.000Z",
        filename: "src/foo.ts",
        actor: { type: "user", id: "u_123" },
        environment: { os: "linux", ccgVersion: "2.1.0" },
        timestamp: "2025-12-19T08:00:00.000Z",
        validation: { valid: true, issues: [], blocked: false, suggestions: [] },
        metricsDelta: { tdi: { before: 75, after: 74, delta: -1, budgetExceeded: false } },
        trustLevel: "LOCAL_UNSIGNED",
      });

      const res = await service.verify({ proofPack: pack });
      expect(res.verified).toBe(true);
    });

    it("fails with HASH_MISMATCH when tampered", async () => {
      const spy = vi.fn();
      eventBus.on("proofpack:verified", (event) => spy(event.data));

      const service = createService();

      const pack = await service.create({
        id: "pp_x",
        createdAt: "2025-12-19T08:00:00.000Z",
        filename: "src/foo.ts",
        actor: { type: "user", id: "u_123" },
        environment: { os: "linux", ccgVersion: "2.1.0" },
        timestamp: "2025-12-19T08:00:00.000Z",
        validation: { valid: true, issues: [], blocked: false, suggestions: [] },
        metricsDelta: { tdi: { before: 75, after: 74, delta: -1, budgetExceeded: false } },
        trustLevel: "LOCAL_UNSIGNED",
      });

      // Tamper with the pack
      const tampered = {
        ...pack,
        validation: { valid: false, issues: [], blocked: true, suggestions: [] }
      };

      const res = await service.verify({ proofPack: tampered });
      expect(res.verified).toBe(false);
      expect(res.reason).toBe("HASH_MISMATCH");
      expect(res.actualHash).toBe(pack.hash);
      expect(res.expectedHash).not.toBe(pack.hash);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          proofPackId: "pp_x",
          verified: false,
          reason: "HASH_MISMATCH",
        })
      );
    });
  });
});
