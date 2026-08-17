import { NextResponse } from "next/server";
import { getCapabilities } from "@/lib/vibeApi";
import { DEMO_CAPABILITIES, isDemoMode } from "@/lib/demo";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ demo: true, ...DEMO_CAPABILITIES });
  }

  try {
    const capabilities = await getCapabilities();
    return NextResponse.json({ demo: false, ...capabilities });
  } catch {
    return NextResponse.json(
      { status: "error", error: "capabilities_failed", message: "Не удалось загрузить каталог моделей." },
      { status: 502 }
    );
  }
}
