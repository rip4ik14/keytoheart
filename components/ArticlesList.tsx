'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { articles } from '@/lib/articles';

export default function ArticlesList() {
  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((post, idx) => (
        <Link key={post.slug} href={`/articles/${post.slug}`} className="group">
          <motion.div
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-2 group-hover:text-pink-600 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600 mb-4">{post.description}</p>
            <span className="text-pink-600 font-medium">Читать →</span>
          </motion.div>
        </Link>
      ))}
    </section>
  );
}
