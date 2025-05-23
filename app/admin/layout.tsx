import { ReactNode } from 'react';
     import { motion } from 'framer-motion';
     import Link from 'next/link';
     import { supabasePublic } from '@/lib/supabase/client';

     export default async function AdminLayout({ children }: { children: ReactNode }) {
       const { data: { session }, error } = await supabasePublic.auth.getSession();

       if (error) {
         console.error('AdminLayout: Supabase getSession error:', error);
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