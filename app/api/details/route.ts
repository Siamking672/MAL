import { NextResponse } from "next/server";
import { normalizeDetails } from "@/lib/jikan";
import { getDetails } from "@/lib/sync";
import type { MediaKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as MediaKind;
    const id = Number(url.searchParams.get("id"));

    if (!id || !["anime", "manga"].includes(kind)) {
      return NextResponse.json({ error: "Valid kind and id are required" }, { status: 400 });
    }

    const raw = await getDetails(kind, id);
    return NextResponse.json({ raw, details: normalizeDetails(raw, kind) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load details" },
      { status: 500 }
    );
  }
}
