import { NextResponse } from "next/server";
import { estimateGeneration, VibeApiError } from "@/lib/vibeApi";
import { demoEstimate, isDemoMode } from "@/lib/demo";
import { describeApiError } from "@/lib/errors";
import { estimateBodySchema } from "@/lib/schemas";
import { buildEstimateParams } from "@/lib/compat";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = estimateBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "error", error: "validation_failed", message: "Некорректные параметры запроса." },
      { status: 400 }
    );
  }

  const { model, prompt, aspect_ratio, seed, image_input } = parsed.data;
  const params = buildEstimateParams(model, prompt, aspect_ratio, seed, image_input);

  if (isDemoMode()) {
    return NextResponse.json({ demo: true, ...demoEstimate(params) });
  }

  try {
    const result = await estimateGeneration(params);
    return NextResponse.json({ demo: false, ...result });
  } catch (err) {
    if (err instanceof VibeApiError) {
      return NextResponse.json(
        {
          status: "error",
          error: err.body.error,
          message: describeApiError(err.body.error, err.body.message),
          request_id: err.body.request_id,
        },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { status: "error", error: "network_error", message: "Не удалось связаться с VibeMarketolog API." },
      { status: 502 }
    );
  }
}
