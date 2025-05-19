'use server';

import { cookies } from 'next/headers';

export async function setSupabaseCookies(
  cookiesToSet: { name: string; value: string; [key: string]: any }[],
) {
  // await!
  const cookieStore = await cookies();
  cookiesToSet.forEach(({ name, value, ...options }) => {
    cookieStore.set(name, value, options);
  });
}
