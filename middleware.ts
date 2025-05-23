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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};