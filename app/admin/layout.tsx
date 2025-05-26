// File: app/admin/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminJwt } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'
import type { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // --- ОБЯЗАТЕЛЬНО async + await ---
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const isAuthed = token ? verifyAdminJwt(token) : false

  if (!isAuthed) {
    redirect('/admin/login?error=no-session')
  }

  return (
    <>
      {/* Toaster подключаем здесь, чтобы можно было убирать/добавлять уведомления */}
      <Toaster position="top-right" />
      {children}
    </>
  )
}
