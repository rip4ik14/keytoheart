// app/api/admin-login/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = process.env.ADMIN_PASSWORD;

  // временный лог — уберёшь после отладки
  console.log("🔐 Admin login attempt:", { password, correct });

  if (password === correct) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("auth-admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: 60 * 60 * 8, // 8 часов
    });
    return res;
  } else {
    return NextResponse.json(
      { error: "Wrong password" },
      { status: 401 }
    );
  }
}

