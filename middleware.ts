import { NextResponse } from 'next/server';
  import { createServerClient } from '@supabase/ssr';
  import type { Database } from '@/lib/supabase/types_new';

  export async function middleware(request: Request) {
    const url = new URL(request.url);
    const isAdminRoute = url.pathname.startsWith('/admin');

    if (isAdminRoute && url.pathname !== '/admin/login') {
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = request.headers.get('cookie')?.split('; ').find(row => row.startsWith(`${name}=`));
              return cookie?.split('=')[1];
            },
            set() {},
            remove() {},
          },
        }
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Middleware: Supabase getSession error:', sessionError);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      if (!session) {
        console.log('Middleware: No session found for', url.pathname);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Безопасно получаем пользователя через getUser
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user.user) {
        console.error('Middleware: Supabase getUser error:', userError || 'No user found');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.user.id)
        .single();

      if (adminError || !admin || admin.role !== 'admin') {
        console.error('Middleware: Admin check failed:', adminError || `Role not admin: ${admin?.role}`);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    return NextResponse.next();
  }

  export const config = {
    matcher: ['/admin/:path*'],
  };