import { describe, expect, it } from "vitest";
import { summarizeByCategory, summarizeVotes } from "./votes";
import type { VoteRecord } from "./types";

function vote(overrides: Partial<VoteRecord>): VoteRecord {
  return {
    id: "id",
    created_at: "2026-01-01T00:00:00Z",
    category: "ad_banner",
    prompt: "p",
    model_a: "model-a",
    model_b: "model-b",
    winner: "a",
    price_a_rub: 10,
    price_b_rub: 20,
    latency_a_ms: 1000,
    latency_b_ms: 2000,
    ...overrides,
  };
}

describe("summarizeVotes", () => {
  it("returns zeroed summary for no votes", () => {
    expect(summarizeVotes([])).toEqual({
      totalComparisons: 0,
      ties: 0,
      avgPriceRub: 0,
      avgLatencyMs: 0,
      models: [],
    });
  });

  it("aggregates wins, ties and averages per model", () => {
    const votes = [
      vote({ winner: "a" }),
      vote({ winner: "b" }),
      vote({ winner: "tie" }),
    ];
    const summary = summarizeVotes(votes);

    expect(summary.totalComparisons).toBe(3);
    expect(summary.ties).toBe(1);

    const a = summary.models.find((m) => m.model === "model-a")!;
    const b = summary.models.find((m) => m.model === "model-b")!;
    expect(a.wins).toBe(1);
    expect(a.ties).toBe(1);
    expect(a.comparisons).toBe(3);
    expect(b.wins).toBe(1);
    expect(b.ties).toBe(1);
  });
});

describe("summarizeByCategory", () => {
  it("groups models strictly within their own category", () => {
    const votes = [
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a" }),
      vote({ category: "product_card", model_a: "m3", model_b: "m4", winner: "b" }),
    ];
    const result = summarizeByCategory(votes);

    expect(result).toHaveLength(2);
    const banner = result.find((c) => c.category === "ad_banner")!;
    const card = result.find((c) => c.category === "product_card")!;
    expect(banner.models.map((m) => m.model).sort()).toEqual(["m1", "m2"]);
    expect(card.models.map((m) => m.model).sort()).toEqual(["m3", "m4"]);
  });

  it("marks models with fewer than 3 comparisons as insufficient data", () => {
    const votes = [
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a" }),
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "b" }),
    ];
    const [banner] = summarizeByCategory(votes);

    expect(banner.models.every((m) => m.recommendation === "Недостаточно данных")).toBe(true);
  });

  it("recommends the model with the highest win rate once it has enough comparisons", () => {
    const votes = [
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a" }),
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a" }),
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a" }),
    ];
    const [banner] = summarizeByCategory(votes);

    const m1 = banner.models.find((m) => m.model === "m1")!;
    const m2 = banner.models.find((m) => m.model === "m2")!;
    expect(m1.winRate).toBe(100);
    expect(m1.recommendation).toBe("Основная модель");
    expect(m2.recommendation).toBe("Альтернатива");
  });

  it("breaks a win-rate tie in favor of the cheaper model", () => {
    const votes = [
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "a", price_a_rub: 5, price_b_rub: 10 }),
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "b", price_a_rub: 5, price_b_rub: 10 }),
      vote({ category: "ad_banner", model_a: "m1", model_b: "m2", winner: "tie", price_a_rub: 5, price_b_rub: 10 }),
    ];
    const [banner] = summarizeByCategory(votes);

    const m1 = banner.models.find((m) => m.model === "m1")!;
    const m2 = banner.models.find((m) => m.model === "m2")!;
    expect(m1.winRate).toBe(m2.winRate); // одинаковый win rate у обеих
    expect(m1.avgPriceRub).toBeLessThan(m2.avgPriceRub); // m1 дешевле
    expect(m1.recommendation).toBe("Основная модель");
    expect(m2.recommendation).toBe("Альтернатива");
  });
});
