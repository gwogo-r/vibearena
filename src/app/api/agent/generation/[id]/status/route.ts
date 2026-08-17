import { NextResponse } from "next/server";
import { getGenerationStatus, VibeApiError } from "@/lib/vibeApi";
import { demoStatus, isDemoMode } from "@/lib/demo";
import { describeApiError } from "@/lib/errors";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (isDemoMode()) {
    return NextResponse.json({ demo: true, ...demoStatus(id) });
  }

  try {
    const result = await getGenerationStatus(id);
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
