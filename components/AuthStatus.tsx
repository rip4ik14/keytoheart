// components/AuthStatus.tsx
import Link from "next/link";
import { cookies } from "next/headers";

export default function AuthStatus() {
  // Чтение HTTP‑cookie (серверный компонент – не содержит "use client")
  const userPhone = cookies().get("userPhone")?.value;

  return userPhone ? (
    <div className="flex items-center gap-2">
      <Link href="/account" className="hover:underline">
        Личный кабинет
      </Link>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="hover:underline">
          Выйти
        </button>
      </form>
    </div>
  ) : (
    <Link href="/account" className="hover:underline">
      Вход
    </Link>
  );
}
