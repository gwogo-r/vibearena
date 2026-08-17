// Локальное хранение голосов — в браузере (localStorage), без сервера и БД.

import { CATEGORIES, type CategoryId, type VoteRecord } from "./types";

const STORAGE_KEY = "vibearena.votes.v1";

export function getVotes(): VoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VoteRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveVote(vote: VoteRecord): void {
  if (typeof window === "undefined") return;
  const votes = getVotes();
  votes.push(vote);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

export type ModelStats = {
  model: string;
  wins: number;
  ties: number;
  comparisons: number;
  avgPriceRub: number;
  avgLatencyMs: number;
};

export type ResultsSummary = {
  totalComparisons: number;
  ties: number;
  avgPriceRub: number;
  avgLatencyMs: number;
  models: ModelStats[];
};

/** Собирает по-модельную статистику (победы/ничьи/цена/время) из набора голосов — без разбивки по категориям. */
function aggregateModelStats(votes: VoteRecord[]): ModelStats[] {
  const byModel = new Map<string, ModelStats>();
  const touch = (model: string) => {
    if (!byModel.has(model)) {
      byModel.set(model, { model, wins: 0, ties: 0, comparisons: 0, avgPriceRub: 0, avgLatencyMs: 0 });
    }
    return byModel.get(model)!;
  };

  for (const v of votes) {
    const statsA = touch(v.model_a);
    const statsB = touch(v.model_b);
    statsA.comparisons += 1;
    statsB.comparisons += 1;

    if (v.winner === "a") statsA.wins += 1;
    else if (v.winner === "b") statsB.wins += 1;
    else {
      statsA.ties += 1;
      statsB.ties += 1;
    }

    statsA.avgPriceRub += v.price_a_rub;
    statsB.avgPriceRub += v.price_b_rub;
    statsA.avgLatencyMs += v.latency_a_ms;
    statsB.avgLatencyMs += v.latency_b_ms;
  }

  for (const stats of byModel.values()) {
    stats.avgPriceRub = stats.comparisons ? Math.round(stats.avgPriceRub / stats.comparisons) : 0;
    stats.avgLatencyMs = stats.comparisons ? Math.round(stats.avgLatencyMs / stats.comparisons) : 0;
  }

  return Array.from(byModel.values());
}

export function summarizeVotes(votes: VoteRecord[]): ResultsSummary {
  if (votes.length === 0) {
    return { totalComparisons: 0, ties: 0, avgPriceRub: 0, avgLatencyMs: 0, models: [] };
  }

  const ties = votes.filter((v) => v.winner === "tie").length;
  const priceSum = votes.reduce((s, v) => s + v.price_a_rub + v.price_b_rub, 0);
  const latencySum = votes.reduce((s, v) => s + v.latency_a_ms + v.latency_b_ms, 0);
  const priceLatencyCount = votes.length * 2;

  return {
    totalComparisons: votes.length,
    ties,
    avgPriceRub: Math.round(priceSum / priceLatencyCount),
    avgLatencyMs: Math.round(latencySum / priceLatencyCount),
    models: aggregateModelStats(votes).sort((a, b) => b.wins - a.wins),
  };
}

const MIN_COMPARISONS_FOR_RECOMMENDATION = 3;

export type Recommendation = "Недостаточно данных" | "Основная модель" | "Альтернатива";

export type ModelCategoryStats = ModelStats & {
  winRate: number; // 0–100, округлено
  recommendation: Recommendation;
};

export type CategorySummary = {
  category: CategoryId;
  categoryLabel: string;
  models: ModelCategoryStats[];
};

/** Группирует голоса по категории задачи и для каждой считает таблицу моделей с рекомендацией. */
export function summarizeByCategory(votes: VoteRecord[]): CategorySummary[] {
  const byCategory = new Map<CategoryId, VoteRecord[]>();
  for (const v of votes) {
    if (!byCategory.has(v.category)) byCategory.set(v.category, []);
    byCategory.get(v.category)!.push(v);
  }

  const summaries: CategorySummary[] = [];
  for (const [category, categoryVotes] of byCategory) {
    const stats = aggregateModelStats(categoryVotes).map((s) => ({
      ...s,
      winRate: s.comparisons ? Math.round((s.wins / s.comparisons) * 100) : 0,
    }));

    // Кандидат на «Основную модель» выбирается только среди моделей с достаточной выборкой.
    const eligible = stats.filter((s) => s.comparisons >= MIN_COMPARISONS_FOR_RECOMMENDATION);
    let primaryModel: string | null = null;
    if (eligible.length > 0) {
      const maxWinRate = Math.max(...eligible.map((s) => s.winRate));
      const topCandidates = eligible.filter((s) => s.winRate === maxWinRate);
      // При равном win rate основной становится более дешёвая модель.
      primaryModel = topCandidates.sort((a, b) => a.avgPriceRub - b.avgPriceRub)[0].model;
    }

    const models: ModelCategoryStats[] = stats
      .map((s) => ({
        ...s,
        recommendation:
          s.comparisons < MIN_COMPARISONS_FOR_RECOMMENDATION
            ? ("Недостаточно данных" as const)
            : s.model === primaryModel
              ? ("Основная модель" as const)
              : ("Альтернатива" as const),
      }))
      .sort((a, b) => b.winRate - a.winRate || b.comparisons - a.comparisons);

    summaries.push({
      category,
      categoryLabel: CATEGORIES.find((c) => c.id === category)?.label ?? category,
      models,
    });
  }

  return summaries.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel, "ru"));
}
