import { NextResponse } from "next/server";
import { getDashboard, saveUsername } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.username === "string" && body.username.trim()) {
      await saveUsername(body.username);
    }
    const dashboard = await getDashboard(true);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
