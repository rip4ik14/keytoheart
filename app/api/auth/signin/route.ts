import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone) {
    return NextResponse.json({ error: "Телефон не указан" }, { status: 400 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("userPhone", phone, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return response;
}
