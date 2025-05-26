// app/admin/layout.tsx
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
  // await! иначе cookies() вернёт Promise
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  const isAuthed = token ? verifyAdminJwt(token) : false

  if (!isAuthed) {
    // редирект с параметром ошибки
    redirect('/admin/login?error=no-session')
  }

  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  )
}
