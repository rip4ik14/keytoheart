// app/api/admin-logout/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth-admin", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0, // удаляем куку
  });
  return res;
}
