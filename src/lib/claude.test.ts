import { describe, expect, it, vi } from "vitest";
import { withRetry } from "@/lib/claude";

const fail = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });
// timeoutMs: 0 → nur das reale Zeitbudget zählt (kein vorausschauender Abbruch).
const fast = { attempts: 3, baseDelayMs: 1, budgetMs: 10_000, timeoutMs: 0 };

describe("withRetry", () => {
  it("wiederholt 429/503/529 und gibt das Ergebnis zurück", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 3) throw fail(529);
      return "ok";
    });
    await expect(withRetry(fn, fast)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("wirft andere Status sofort", async () => {
    const fn = vi.fn(async () => {
      throw fail(400);
    });
    await expect(withRetry(fn, fast)).rejects.toThrow("HTTP 400");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("bricht ab, wenn das Zeitbudget aufgebraucht ist", async () => {
    const fn = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 50));
      throw fail(503);
    });
    await expect(
      withRetry(fn, { attempts: 5, baseDelayMs: 1, budgetMs: 20, timeoutMs: 0 }),
    ).rejects.toThrow("HTTP 503");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("startet keinen Versuch, der samt Timeout das Budget sprengen würde", async () => {
    // Erster Versuch scheitert sofort; ein zweiter dürfte bis zu 200 ms dauern,
    // im Budget von 100 ms sind aber nur noch ~100 ms übrig → kein Retry.
    const fn = vi.fn(async () => {
      throw fail(429);
    });
    await expect(
      withRetry(fn, { attempts: 3, baseDelayMs: 1, budgetMs: 100, timeoutMs: 200 }),
    ).rejects.toThrow("HTTP 429");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
