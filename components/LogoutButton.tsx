"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 text-sm underline hover:text-red-800 transition"
    >
      Выйти
    </button>
  );
}
