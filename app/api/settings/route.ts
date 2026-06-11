import { NextResponse } from "next/server";
import { getDashboard, getSavedUsername, saveUsername } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dashboard = await getDashboard(false);
    const username = await getSavedUsername();
    return NextResponse.json({ username, lastSyncedAt: dashboard.lastSyncedAt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = await saveUsername(body.username || "");
    return NextResponse.json({ username });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 400 }
    );
  }
}
