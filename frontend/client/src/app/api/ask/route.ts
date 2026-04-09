import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function ask(query: string): Promise<NextResponse>{
    try {
        const apiResponse = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        return NextResponse.json({ error: errorData.error || "An error occurred while processing your request." }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred." }, { status: 500 });
    }
}