import { describe, expect, it } from "vitest";
import { AIError, assertWithinBudget } from "@/lib/ai/client";
import { failFromError } from "@/lib/http";

describe("budget guard", () => {
  it("allows calls below the budget", () => {
    expect(() => assertWithinBudget(3.99, 4)).not.toThrow();
  });

  it("blocks calls at or above the budget with BUDGET_EXCEEDED", () => {
    for (const spent of [4, 4.2]) {
      try {
        assertWithinBudget(spent, 4);
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as AIError).code).toBe("BUDGET_EXCEEDED");
      }
    }
  });

  it("maps to HTTP 402", async () => {
    const response = failFromError(new AIError("over", { code: "BUDGET_EXCEEDED" }));
    expect(response.status).toBe(402);
    expect((await response.json()).error.code).toBe("budget_exceeded");
    expect(failFromError(new AIError("bad output")).status).toBe(502);
  });
});

describe("content language", () => {
  it("names the configured language in the system prompt", async () => {
    const { contentLanguageRule } = await import("@/lib/ai/client");
    expect(contentLanguageRule("en")).toContain("Content language: English");
    expect(contentLanguageRule("ro")).toContain("Romanian");
  });
});
