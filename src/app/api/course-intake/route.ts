import { NextResponse } from "next/server";
import { getIntakeSnapshot } from "@/lib/course-intake";

export async function GET() {
  try {
    return NextResponse.json(await getIntakeSnapshot(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load your course status. Please try again." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
