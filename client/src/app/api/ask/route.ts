import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query || query.length < 5) {
      return NextResponse.json(
        { error: "Query must be at least 5 characters." },
        { status: 400 },
      );
    }

    const apiResponse = await fetch(`${BACKEND_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
