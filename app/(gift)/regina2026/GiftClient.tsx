'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BASE = '/gift/2026-newyear';

function cn(...v: Array<string | false | undefined>) {
  return v.filter(Boolean).join(' ');
}

export default function GiftClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const story = useMemo(
    () => [
      {
        title: 'Мы многое прошли вместе',
        text: `Мы с тобой многое преодолеваем и пережили.
Не всё было легко, не всё было просто - но именно так и появляется настоящая глубина.

Любовь не растёт без трудностей.
Она крепнет в них.
Становится шире, сильнее и честнее.`,
      },
      {
        title: 'Ты - моя улыбка',
        text: `
Моё счастье.
Часть моей жизни, без которой я уже не представляю себя.

Я горжусь тобой.
Горжусь тем, что ты делаешь для себя.
Для нас.
Горжусь тем, какая ты есть.`,
      },
      {
        title: 'Моё пожелание тебе',
        text: `Я желаю тебе гармонии - внутри и вокруг.
Бескрайнего, безмерного счастья.
Улыбок - настоящих и бесконечных.

Будь собой.
Не стесняйся этого.
Получай от этого искреннее удовольствие.

Я люблю тебя такой, какая ты есть.
Какой бы ты ни была.
И я рядом. Всегда.`,
      },
    ],
    [],
  );

  // --- Reveal helper: делаем так, чтобы анимации точно работали без CSS конфликтов
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!els.length) return;

    // стартовое состояние (на всякий случай, если браузер кэшнул классы)
    els.forEach((el) => el.classList.remove('is-in'));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-in');
        });
      },
      {
        // чуть раньше, чтобы выглядело "живее"
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // --- Видео: autoplay при появлении (со звуком нельзя гарантировать, поэтому muted пока soundOn=false)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !soundOn;
    video.playsInline = true;

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          try {
            await video.play();
          } catch {
            // Нормально: некоторые браузеры блокируют autoplay
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.45 },
    );

    io.observe(video);
    return () => io.disconnect();
  }, [soundOn]);

  const enableSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      setSoundOn(true);
      await video.play();
    } catch {
      setSoundOn(true);
    }
  };

  // Inline reveal styles (не зависят от глобального CSS)
  const revealBase: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(16px) scale(0.98)',
    transition:
      'opacity 700ms cubic-bezier(0.2,1,0.2,1), transform 700ms cubic-bezier(0.2,1,0.2,1)',
    willChange: 'opacity, transform',
  };

  const revealIn: React.CSSProperties = {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  };

  return (
    <main className="min-h-[100svh] text-black">
      <div className="relative overflow-hidden">
        {/* Фон */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-rose-50 via-white to-amber-50" />

        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
          {/* HERO */}
          <section
            data-reveal
            className="reveal rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-7 shadow-lg backdrop-blur"
            style={revealBase}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                🌸 Для моего цветочка Ри
              </span>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-bold leading-tight">
              С Новым годом, мой цветочек 🌸
            </h1>

            <p className="mt-4 text-[15px] leading-relaxed text-black/75">
              Эта страница - как маленькая история.
              <br />
              Просто листай вниз.
              <br />
              Всё будет открываться шаг за шагом.
            </p>

            <p className="mt-3 text-xs text-black/45">
              Видео включится автоматически, звук - по кнопке (так работают браузеры).
            </p>
          </section>

          {/* STORY */}
          <section className="mt-6 space-y-4">
            {story.map((s, i) => (
              <RevealCard key={i} title={s.title} text={s.text} base={revealBase} inStyle={revealIn} />
            ))}
          </section>

          {/* VIDEO */}
          <section
            id="video"
            data-reveal
            className="reveal mt-6 rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur"
            style={revealBase}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">📸 Наше видео</h2>

              <button
                onClick={enableSound}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-medium transition',
                  'active:scale-[0.99]',
                  soundOn
                    ? 'border border-black/10 bg-white text-black/70'
                    : 'bg-black text-white hover:bg-black/90',
                )}
              >
                {soundOn ? '🔊 Звук включён' : '🔊 Включить звук'}
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-black">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                muted={!soundOn}
                // если постера нет - просто удали следующую строку
                poster={`${BASE}/poster.jpg`}
                className="aspect-video w-full"
              >
                <source src={`${BASE}/video.mp4`} type="video/mp4" />
              </video>
            </div>

            <p className="mt-2 text-xs text-black/45">
              Если звук не включился сразу, нажми кнопку ещё раз или Play на видео.
            </p>
          </section>

          {/* TICKET - ТОЛЬКО ВНИЗУ */}
          <section
            data-reveal
            className="reveal mt-6 rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-7 shadow-sm backdrop-blur"
            style={revealBase}
          >
            <h2 className="text-lg font-semibold">🎟 И теперь - подарок</h2>

            <p className="mt-3 text-[15px] leading-relaxed text-black/75">
              Я купил билет на концерт <b>Uma2rman</b> - <b>27 марта</b>, Москва ❤️
              <br />
              Это будет твой вечер. Живой. Настоящий. Как мы.
            </p>

            <a
              href={`${BASE}/ticket.pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-6 w-full justify-center"
            >
              Открыть билет
            </a>

            <a
              href={`${BASE}/ticket.pdf`}
              download
              className="mt-3 block text-center text-xs underline text-black/50"
            >
              Скачать билет
            </a>
          </section>

          <footer className="py-10 text-center text-xs text-black/40">
            Сделано с любовью ❤️
          </footer>
        </div>
      </div>

      {/* маленький скрипт: применяем revealIn стиль, когда добавляется класс is-in */}
      <style>{`
        .reveal.is-in {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
      `}</style>
    </main>
  );
}

// Отдельная карточка, чтобы не дублировать разметку
function RevealCard({
  title,
  text,
  base,
  inStyle,
}: {
  title: string;
  text: string;
  base: React.CSSProperties;
  inStyle: React.CSSProperties;
}) {
  // Тут хитрость: базовый стиль всегда задан inline,
  // а "включение" делается классом is-in (через маленький CSS снизу).
  // inStyle оставлен на будущее, если захочешь переключать через state.
  void inStyle;

  return (
    <article
      data-reveal
      className="reveal rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur"
      style={base}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-black/75">
        {text}
      </p>
    </article>
  );
}
