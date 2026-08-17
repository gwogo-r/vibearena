// Общий тип состояния одного варианта (A или B) в ходе эксперимента.

export type VariantState = {
  model: string;
  generationId: string | number | null;
  displayStatus: "idle" | "processing" | "complete" | "error";
  priceRub: number | null;
  resultUrl: string | null;
  errorMessage: string | null;
  requestId: string | null;
  refunded: boolean;
  startedAt: number | null;
  completedAt: number | null;
};

export function emptyVariant(model: string): VariantState {
  return {
    model,
    generationId: null,
    displayStatus: "idle",
    priceRub: null,
    resultUrl: null,
    errorMessage: null,
    requestId: null,
    refunded: false,
    startedAt: null,
    completedAt: null,
  };
}
