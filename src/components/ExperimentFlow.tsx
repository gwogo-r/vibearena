"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CategoryId, EstimateResponse, ImageModel, VoteReasonId, VoteRecord, Winner } from "@/lib/types";
import {
  buildPhotoPrompt,
  canShareSeed,
  commonAspectRatios,
  filterModelsForMode,
  getImageModels,
  pickDefaultPair,
} from "@/lib/compat";
import { emptyVariant, type VariantState } from "@/lib/experiment";
import { saveVote } from "@/lib/votes";
import SetupStep from "./SetupStep";
import EstimateStep from "./EstimateStep";
import GeneratingStep from "./GeneratingStep";
import CompareStep from "./CompareStep";
import RevealStep from "./RevealStep";
import ResultsSummarySection from "./ResultsSummary";

type Step = "setup" | "estimate" | "generating" | "reveal";

type ApiEnvelope<T> = T & { demo?: boolean };
type ApiErrorBody = { message?: string; request_id?: string };

// Все наши API routes возвращают не-2xx статус при ошибке — этого достаточно,
// не нужно ещё и заглядывать в тело ответа (там разная форма для успеха/ошибки).
async function readJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = await res.json();
  if (!res.ok) {
    const body = json as ApiErrorBody;
    const err = new Error(body.message ?? "Запрос завершился ошибкой");
    (err as Error & { requestId?: string }).requestId = body.request_id;
    throw err;
  }
  return json as ApiEnvelope<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<T>(res);
}

async function getJson<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { cache: "no-store" });
  return readJson<T>(res);
}

const POLL_INTERVAL_MS = 12000;

export default function ExperimentFlow() {
  const [step, setStep] = useState<Step>("setup");
  const [models, setModels] = useState<ImageModel[]>([]);
  const [demo, setDemo] = useState(false);
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null);

  const [category, setCategory] = useState<CategoryId>("ad_banner");
  const [prompt, setPrompt] = useState("");
  const [modelAId, setModelAId] = useState("");
  const [modelBId, setModelBId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  // Фактически применённый формат (выбран пользователем или подобран автоматически на смете) —
  // именно его нужно использовать в /generate, а не сырое состояние селекта aspectRatio.
  const [resolvedAspectRatio, setResolvedAspectRatio] = useState<string | undefined>(undefined);

  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageName, setProductImageName] = useState<string | null>(null);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [productImageError, setProductImageError] = useState<string | null>(null);

  const availableModels = filterModelsForMode(models, Boolean(productImageUrl));

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [estimateA, setEstimateA] = useState<EstimateResponse | null>(null);
  const [estimateB, setEstimateB] = useState<EstimateResponse | null>(null);
  const [seedWarning, setSeedWarning] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [variantA, setVariantA] = useState<VariantState>(emptyVariant(""));
  const [variantB, setVariantB] = useState<VariantState>(emptyVariant(""));

  const [lastVote, setLastVote] = useState<VoteRecord | null>(null);
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getJson<{ image_models: ImageModel[] }>("/api/agent/capabilities")
      .then((data) => {
        const imageModels = getImageModels(data.image_models ?? []);
        setModels(imageModels);
        setDemo(Boolean(data.demo));
        // Предвыбираем две самые дешёвые модели (без фото — обычный text-to-image список).
        const defaultPair = pickDefaultPair(filterModelsForMode(imageModels, false));
        if (defaultPair) {
          setModelAId(defaultPair[0]);
          setModelBId(defaultPair[1]);
        }
      })
      .catch(() => setCapabilitiesError("Не удалось загрузить каталог моделей. Обновите страницу."));
  }, []);

  function handleModelAChange(id: string) {
    setModelAId(id);
    setAspectRatio("");
  }

  function handleModelBChange(id: string) {
    setModelBId(id);
    setAspectRatio("");
  }

  async function handleProductImageChange(file: File) {
    setProductImageUploading(true);
    setProductImageError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/agent/upload-media", { method: "POST", body: form });
      const data = await readJson<{ url: string }>(res);
      setProductImageUrl(data.url);
      setProductImageName(file.name);
      // В списке моделей для фото-режима могут не быть текущих A/B — пересобираем пару.
      const newPair = pickDefaultPair(filterModelsForMode(models, true));
      setModelAId(newPair?.[0] ?? "");
      setModelBId(newPair?.[1] ?? "");
      setAspectRatio("");
    } catch (e) {
      setProductImageError(e instanceof Error ? e.message : "Не удалось загрузить фото.");
    } finally {
      setProductImageUploading(false);
    }
  }

  function handleProductImageRemove() {
    setProductImageUrl(null);
    setProductImageName(null);
    setProductImageError(null);
    const newPair = pickDefaultPair(filterModelsForMode(models, false));
    setModelAId(newPair?.[0] ?? "");
    setModelBId(newPair?.[1] ?? "");
    setAspectRatio("");
  }

  const resetExperiment = useCallback(() => {
    setStep("setup");
    setPrompt("");
    setProductImageUrl(null);
    setProductImageName(null);
    setProductImageError(null);
    const defaultPair = pickDefaultPair(filterModelsForMode(models, false));
    setModelAId(defaultPair?.[0] ?? "");
    setModelBId(defaultPair?.[1] ?? "");
    setAspectRatio("");
    setResolvedAspectRatio(undefined);
    setEstimateA(null);
    setEstimateB(null);
    setSeedWarning(null);
    setSeed(undefined);
    setSetupError(null);
    setVariantA(emptyVariant(""));
    setVariantB(emptyVariant(""));
    setLastVote(null);
  }, [models]);

  async function handleSubmitSetup() {
    const modelA = models.find((m) => m.id === modelAId);
    const modelB = models.find((m) => m.id === modelBId);
    if (!modelA || !modelB) return;

    setSetupLoading(true);
    setSetupError(null);

    const ratios = commonAspectRatios(modelA, modelB);
    const ratio = aspectRatio || ratios[0] || undefined;
    setResolvedAspectRatio(ratio);
    const sharedSeed = canShareSeed(modelA, modelB) ? Math.floor(Math.random() * 2147483647) : undefined;
    const apiPrompt = productImageUrl ? buildPhotoPrompt(prompt) : prompt;
    const imageInput = productImageUrl ? [productImageUrl] : undefined;

    try {
      const [respA, respB] = await Promise.all([
        postJson<EstimateResponse>("/api/agent/generate/estimate", {
          model: modelA.id,
          prompt: apiPrompt,
          aspect_ratio: ratio,
          seed: sharedSeed,
          image_input: imageInput,
        }),
        postJson<EstimateResponse>("/api/agent/generate/estimate", {
          model: modelB.id,
          prompt: apiPrompt,
          aspect_ratio: ratio,
          seed: sharedSeed,
          image_input: imageInput,
        }),
      ]);
      setEstimateA(respA);
      setEstimateB(respB);
      setSeed(sharedSeed);
      setSeedWarning(
        sharedSeed === undefined
          ? "Хотя бы одна модель не поддерживает seed — сравнение содержит фактор случайности."
          : null
      );
      setStep("estimate");
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : "Не удалось рассчитать стоимость.");
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleConfirmGenerate() {
    const modelA = models.find((m) => m.id === modelAId)!;
    const modelB = models.find((m) => m.id === modelBId)!;

    setConfirmLoading(true);
    setVariantA({ ...emptyVariant(modelA.id), displayStatus: "processing", startedAt: Date.now() });
    setVariantB({ ...emptyVariant(modelB.id), displayStatus: "processing", startedAt: Date.now() });

    const apiPrompt = productImageUrl ? buildPhotoPrompt(prompt) : prompt;
    const imageInput = productImageUrl ? [productImageUrl] : undefined;

    try {
      const [respA, respB] = await Promise.all([
        postJson<{ generation_id: string | number; price_rub?: number; cost?: number }>(
          "/api/agent/generate",
          { model: modelA.id, prompt: apiPrompt, aspect_ratio: resolvedAspectRatio, seed, idempotency_key: crypto.randomUUID(), variant: "a", image_input: imageInput }
        ),
        postJson<{ generation_id: string | number; price_rub?: number; cost?: number }>(
          "/api/agent/generate",
          { model: modelB.id, prompt: apiPrompt, aspect_ratio: resolvedAspectRatio, seed, idempotency_key: crypto.randomUUID(), variant: "b", image_input: imageInput }
        ),
      ]);
      setVariantA((v) => ({ ...v, generationId: respA.generation_id, priceRub: respA.price_rub ?? respA.cost ?? null }));
      setVariantB((v) => ({ ...v, generationId: respB.generation_id, priceRub: respB.price_rub ?? respB.cost ?? null }));
      setStep("generating");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось запустить генерацию.";
      setVariantA((v) => ({ ...v, displayStatus: "error", errorMessage: message }));
      setVariantB((v) => ({ ...v, displayStatus: "error", errorMessage: message }));
      setStep("generating");
    } finally {
      setConfirmLoading(false);
    }
  }

  // Поллинг статуса обоих вариантов, пока оба не завершатся (успешно или с ошибкой).
  useEffect(() => {
    const aDone = variantA.displayStatus === "complete" || variantA.displayStatus === "error";
    const bDone = variantB.displayStatus === "complete" || variantB.displayStatus === "error";
    if (step !== "generating" || (aDone && bDone)) return;

    async function pollOne(
      variant: VariantState,
      setVariant: (fn: (v: VariantState) => VariantState) => void
    ) {
      if (!variant.generationId || variant.displayStatus === "complete" || variant.displayStatus === "error") return;
      try {
        const data = await getJson<{
          status: string;
          display_url?: string;
          result_url?: string;
          price_rub?: number;
          cost?: number;
          refunded?: boolean;
          error_message?: string | null;
        }>(`/api/agent/generation/${variant.generationId}/status`);

        if (data.status === "complete") {
          setVariant((v) => ({
            ...v,
            displayStatus: "complete",
            resultUrl: data.display_url ?? data.result_url ?? null,
            priceRub: data.price_rub ?? data.cost ?? v.priceRub,
            completedAt: Date.now(),
          }));
        } else if (data.status === "error") {
          setVariant((v) => ({
            ...v,
            displayStatus: "error",
            errorMessage: data.error_message ?? "Ошибка генерации.",
            refunded: Boolean(data.refunded),
            completedAt: Date.now(),
          }));
        }
      } catch (e) {
        const err = e as Error & { requestId?: string };
        setVariant((v) => ({
          ...v,
          displayStatus: "error",
          errorMessage: err.message,
          requestId: err.requestId ?? null,
          completedAt: Date.now(),
        }));
      }
    }

    const tick = () => {
      pollOne(variantA, setVariantA);
      pollOne(variantB, setVariantB);
    };

    tick();
    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, variantA.generationId, variantB.generationId, variantA.displayStatus, variantB.displayStatus]);

  const bothComplete = variantA.displayStatus === "complete" && variantB.displayStatus === "complete";

  function handleVote(winner: Winner, reason?: VoteReasonId) {
    const vote: VoteRecord = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      category,
      prompt,
      model_a: variantA.model,
      model_b: variantB.model,
      winner,
      reason,
      price_a_rub: variantA.priceRub ?? 0,
      price_b_rub: variantB.priceRub ?? 0,
      latency_a_ms: variantA.startedAt && variantA.completedAt ? variantA.completedAt - variantA.startedAt : 0,
      latency_b_ms: variantB.startedAt && variantB.completedAt ? variantB.completedAt - variantB.startedAt : 0,
    };
    saveVote(vote);
    setLastVote(vote);
    setResultsRefreshKey((k) => k + 1);
    setStep("reveal");
  }

  const modelALabel = models.find((m) => m.id === modelAId)?.title ?? modelAId;
  const modelBLabel = models.find((m) => m.id === modelBId)?.title ?? modelBId;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      {demo && (
        <div className="mb-6 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
          Demo mode — генерация не выполнялась
        </div>
      )}

      {capabilitiesError && (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400">{capabilitiesError}</p>
      )}

      {step === "setup" && (
        <SetupStep
          models={availableModels}
          category={category}
          onCategoryChange={setCategory}
          prompt={prompt}
          onPromptChange={setPrompt}
          modelAId={modelAId}
          modelBId={modelBId}
          onModelAChange={handleModelAChange}
          onModelBChange={handleModelBChange}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          productImageUrl={productImageUrl}
          productImageName={productImageName}
          productImageUploading={productImageUploading}
          productImageError={productImageError}
          onProductImageChange={handleProductImageChange}
          onProductImageRemove={handleProductImageRemove}
          loading={setupLoading}
          error={setupError}
          onSubmit={handleSubmitSetup}
        />
      )}

      {step === "estimate" && estimateA && estimateB && (
        <EstimateStep
          modelALabel={modelALabel}
          modelBLabel={modelBLabel}
          estimateA={estimateA}
          estimateB={estimateB}
          seedWarning={seedWarning}
          loading={confirmLoading}
          onConfirm={handleConfirmGenerate}
          onBack={() => setStep("setup")}
        />
      )}

      {step === "generating" && !bothComplete && (
        <GeneratingStep
          modelALabel={modelALabel}
          modelBLabel={modelBLabel}
          variantA={variantA}
          variantB={variantB}
        />
      )}

      {step === "generating" && bothComplete && variantA.resultUrl && variantB.resultUrl && (
        <CompareStep imageUrlA={variantA.resultUrl} imageUrlB={variantB.resultUrl} onVote={handleVote} />
      )}

      {step === "reveal" && lastVote && (
        <RevealStep variantA={variantA} variantB={variantB} vote={lastVote} onRestart={resetExperiment} />
      )}

      <ResultsSummarySection refreshKey={resultsRefreshKey} />
    </div>
  );
}
