import { NextResponse } from "next/server";
import { uploadMedia, VibeApiError } from "@/lib/vibeApi";
import { isDemoMode } from "@/lib/demo";
import { describeApiError } from "@/lib/errors";

const REAL_MAX_BYTES = 30 * 1024 * 1024; // лимит реального API для изображений
const DEMO_MAX_BYTES = 8 * 1024 * 1024; // demo mode хранит фото как data:-URL в памяти браузера — держим его компактным
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { status: "error", error: "validation_failed", message: "Файл не найден в запросе." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { status: "error", error: "validation_failed", message: "Поддерживаются только JPEG, PNG, WebP и GIF." },
      { status: 400 }
    );
  }

  const demo = isDemoMode();
  const limit = demo ? DEMO_MAX_BYTES : REAL_MAX_BYTES;
  if (file.size > limit) {
    return NextResponse.json(
      {
        status: "error",
        error: "validation_failed",
        message: `Файл слишком большой (максимум ${Math.round(limit / 1024 / 1024)} МБ).`,
      },
      { status: 400 }
    );
  }

  if (demo) {
    // Нет реального хранилища — превращаем фото в data:-URL, чтобы честно показать именно то,
    // что загрузил пользователь, без обращения к настоящему API.
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({ demo: true, status: "ok", url });
  }

  try {
    const result = await uploadMedia(file, file.name || "product.jpg");
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
