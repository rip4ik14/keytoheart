'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на страницу управления товарами по умолчанию
    router.push('/admin/products');
  }, [router]);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p>Перенаправление...</p>
    </motion.div>
  );
}