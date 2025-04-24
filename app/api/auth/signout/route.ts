import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("userPhone", { path: "/" });
  return response;
}
