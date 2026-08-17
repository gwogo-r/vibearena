"use client";

import { useState } from "react";
import { VOTE_REASONS, type VoteReasonId, type Winner } from "@/lib/types";

export default function CompareStep({
  imageUrlA,
  imageUrlB,
  onVote,
}: {
  imageUrlA: string;
  imageUrlB: string;
  onVote: (winner: Winner, reason?: VoteReasonId) => void;
}) {
  const [reason, setReason] = useState<VoteReasonId | "">("");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Слепое сравнение</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Названия моделей, провайдер и цена скрыты до голосования.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Вариант A</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrlA}
            alt="Вариант A"
            className="aspect-square w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Вариант B</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrlB}
            alt="Вариант B"
            className="aspect-square w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Причина (необязательно)</span>
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={reason}
          onChange={(e) => setReason(e.target.value as VoteReasonId | "")}
        >
          <option value="">Не указывать</option>
          {VOTE_REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          onClick={() => onVote("a", reason || undefined)}
        >
          Лучше A
        </button>
        <button
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
          onClick={() => onVote("tie", reason || undefined)}
        >
          Ничья
        </button>
        <button
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          onClick={() => onVote("b", reason || undefined)}
        >
          Лучше B
        </button>
      </div>
    </div>
  );
}
