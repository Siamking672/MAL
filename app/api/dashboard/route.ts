import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "1";
    const dashboard = await getDashboard(force);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
