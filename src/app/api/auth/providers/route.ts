import { NextResponse } from "next/server";
import { GOOGLE_CONFIGURED } from "@/lib/google-oauth";
import { APPLE_CONFIGURED } from "@/lib/apple-oauth";

export async function GET() {
  return NextResponse.json({ google: GOOGLE_CONFIGURED, apple: APPLE_CONFIGURED });
}
