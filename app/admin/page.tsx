import { motion } from 'framer-motion';

export default function AdminDashboard() {
  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-sans font-bold mb-6">Добро пожаловать в админ-панель</h1>
      <p className="text-gray-600">
        Используйте меню слева для управления товарами и настройками магазина.
      </p>
    </motion.div>
  );
}