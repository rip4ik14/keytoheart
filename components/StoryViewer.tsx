'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

interface Story {
  id: number;
  title: string;
  image_url: string;
}

export default function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(0);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2"
        aria-label="Закрыть сторис"
      >
        <Image src="/icons/x.svg" alt="Закрыть" width={24} height={24} />
      </button>
      <div className="absolute top-0 left-0 w-full h-1 bg-white/30">
        <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
      </div>
      <Swiper
        direction="vertical"
        autoplay={{ delay: 5000 }}
        modules={[Autoplay]}
        loop
        className="h-full w-full"
        initialSlide={initialIndex}
        onAutoplayTimeLeft={(_, __, p) => setProgress(p)}
      >
        {stories.map((s) => (
          <SwiperSlide key={s.id}>
            <div className="flex items-center justify-center h-full">
              <div className="relative w-full h-full aspect-[9/16] mx-auto">
                <Image src={s.image_url} alt={s.title} fill className="object-cover" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
