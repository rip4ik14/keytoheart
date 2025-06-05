'use client';

       import { useEffect, useState } from 'react';
       import { createBrowserClient } from '@supabase/ssr';
       import type { Database } from '@/lib/supabase/types_new';
       import Link from 'next/link';

       export default function AuthStatus() {
         const [session, setSession] = useState<any>(null);
         const supabase = createBrowserClient<Database>(
           process.env.NEXT_PUBLIC_SUPABASE_URL!,
           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
         );

         useEffect(() => {
           const fetchSession = async () => {
             const { data: { session }, error } = await supabase.auth.getSession();
             if (error) {
               process.env.NODE_ENV !== "production" && console.error('AuthStatus: getSession error:', error.message);
             }
             setSession(session);
           };

           fetchSession();

           const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                          setSession(session);
           });

           return () => {
             subscription?.unsubscribe();
           };
         }, [supabase]);

         return (
           <div>
             {session ? (
               <Link href="/account" className="text-black hover:text-gray-800">
                 Личный кабинет
               </Link>
             ) : (
               <Link href="/account" className="text-black hover:text-gray-800">
                 Войти
               </Link>
             )}
           </div>
         );
       }