import { ReactNode } from 'react';
  import { motion } from 'framer-motion';
  import Link from 'next/link';
  import { supabasePublic } from '@/lib/supabase/client';

  export default async function AdminLayout({ children }: { children: ReactNode }) {
    const { data: { session }, error: sessionError } = await supabasePublic.auth.getSession();

    // Пропускаем проверку сессии для страницы логина
    const isLoginPage = typeof window === 'undefined' && process.env.NEXT_PUBLIC_CURRENT_PATH === '/admin/login';

    if (!isLoginPage) {
      if (sessionError) {
        console.error('AdminLayout: Supabase getSession error:', sessionError);
        return (
          <div className="min-h-screen flex items-center justify-center">
            <p>Ошибка загрузки сессии. Попробуйте снова.</p>
          </div>
        );
      }

      if (!session) {
        console.log('AdminLayout: No session found');
        return (
          <div className="min-h-screen flex items-center justify-center">
            <p>Пожалуйста, войдите в систему</p>
          </div>
        );
      }

      // Безопасно получаем пользователя через getUser
      const { data: user, error: userError } = await supabasePublic.auth.getUser();
      if (userError || !user.user) {
        console.error('AdminLayout: Supabase getUser error:', userError || 'No user found');
        return (
          <div className="min-h-screen flex items-center justify-center">
            <p>Пожалуйста, войдите в систему</p>
          </div>
        );
      }

      const { data: admin, error: adminError } = await supabasePublic
        .from('admins')
        .select('role')
        .eq('id', user.user.id)
        .single();

      if (adminError || !admin || admin.role !== 'admin') {
        console.error('AdminLayout: Admin check failed:', adminError || 'No admin role');
        return (
          <div className="min-h-screen flex items-center justify-center">
            <p>Пожалуйста, войдите в систему</p>
          </div>
        );
      }
    }

    return (
      <div className="min-h-screen bg-gray-100 flex">
        <motion.aside
          className="w-64 bg-white shadow-lg"
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">
            <h2 className="text-xl font-sans font-bold">KeyToHeart Admin</h2>
          </div>
          <nav className="mt-6">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="block px-6 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className="block px-6 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Товары
                </Link>
              </li>
            </ul>
          </nav>
        </motion.aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    );
  }