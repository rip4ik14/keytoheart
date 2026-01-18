'use client';

// ✅ Путь: components/ArticlesList.tsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { articles } from '@/lib/articles';

export default function ArticlesList() {
  return (
    <section className="grid gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((post, idx) => (
        <Link key={post.slug} href={`/articles/${post.slug}`} className="group">
          <motion.div
            className="
              h-full
              rounded-3xl border border-black/10 bg-white
              p-5 sm:p-6
              shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              transition
              hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]
            "
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.35 }}
          >
            <div className="flex flex-col h-full">
              <div className="text-xs text-black/45">
                {new Date(post.datePublished).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              <h2 className="mt-2 text-lg sm:text-xl font-semibold tracking-tight text-black group-hover:underline">
                {post.title}
              </h2>

              <p className="mt-2 text-sm text-black/60 line-clamp-3">
                {post.description}
              </p>

              <div className="mt-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-black/80">
                  Читать
                  <span className="inline-block translate-x-0 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </section>
  );
}
