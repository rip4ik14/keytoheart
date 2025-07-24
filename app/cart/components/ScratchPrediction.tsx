'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import KeytoheartMascotPremiumAnimated from '@components/KeytoheartMascotPremiumAnimated';

const PREDICTIONS = [
  'Сегодня вам обязательно повезёт!',
  'Ваш заказ принесёт радость и гармонию!',
  'Улыбнитесь — впереди счастье! 😍',
  'Вас ждёт чудесная новость!',
  'Ваша покупка — начало хорошего дня!',
  'Ждите приятного сюрприза!',
  'С вами обязательно свяжутся очень приятные люди 😊',
  'Любовь и удача уже в пути!',
  'Пусть всё, о чём мечтаете, сбудется!',
  'Загадали желание? Сегодня оно исполнится! 🍀'
];

const WIDTH = 340;
const HEIGHT = 140;
const STROKE = 30;
const THRESHOLD = 0.45;

export default function ScratchPredictionPremium() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Случайное предсказание — одно на модалку
  const prediction = useMemo(
    () => PREDICTIONS[Math.floor(Math.random() * PREDICTIONS.length)],
    []
  );

  // Фон‑слой (canvas “тереть”)
  useEffect(() => {
    if (canvasRef.current && !revealed) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        // Градиент
        const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        grad.addColorStop(0, '#fffdfa');
        grad.addColorStop(1, '#f4efe8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Shimmer переливка (волны)
        for (let i = 0; i < 40; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * WIDTH,
            Math.random() * HEIGHT,
            Math.random() * 3 + 0.6,
            0, 2 * Math.PI
          );
          ctx.fillStyle = `rgba(255,236,193,${Math.random() * 0.13 + 0.03})`;
          ctx.fill();
        }

        // Водяной знак — фирменный лого (очень прозрачно)
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.font = 'bold 92px Golos Text, Arial, sans-serif';
        ctx.fillStyle = '#deb06e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('KeyToHeart', WIDTH/2, HEIGHT-6);
        ctx.restore();

        // Надпись “Потрите билетик!”
        ctx.font = 'bold 21px Golos Text, Arial, sans-serif';
        ctx.fillStyle = '#cfa524';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#fff8dc';
        ctx.shadowBlur = 10;
        ctx.fillText('Потрите билетик!', WIDTH / 2, HEIGHT / 2);
        ctx.shadowBlur = 0;
      }
    }
  }, [revealed]);

  // Логика стирания
  const scratch = (x: number, y: number) => {
    if (!canvasRef.current || revealed) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, STROKE, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const checkReveal = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    if (transparent / (WIDTH * HEIGHT) > THRESHOLD) {
      setRevealed(true);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsScratching(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    scratch(e.clientX - rect.left, e.clientY - rect.top);
    checkReveal();
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    scratch(e.clientX - rect.left, e.clientY - rect.top);
    checkReveal();
  };
  const handlePointerUp = () => setIsScratching(false);

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    const touch = e.touches[0];
    if (!touch || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    checkReveal();
  };

  return (
    <div className="flex flex-col items-center my-5 w-full">
      {/* Контейнер — премиум стиль */}
      <div
        className={`
          relative w-full max-w-[340px] min-h-[140px]
          rounded-3xl bg-white
          border border-gray-200
          shadow-[0_8px_44px_-8px_rgba(212,192,145,0.22),0_0_0_4px_#e3dbcd]
          overflow-hidden transition-all duration-700
          ${revealed ? "scale-105" : "hover:scale-[1.02]"}
        `}
        style={{
          boxShadow: '0 10px 38px -8px #dec89833, 0 0 0 2.5px #fff7de',
          filter: revealed ? "drop-shadow(0 0 24px #efd56c32)" : undefined,
        }}
      >
        {/* Фирменный shimmer (shimmer-слой под канвасом) */}
        <div className="absolute inset-0 z-0 animate-shimmer pointer-events-none" />
        {/* Scratch-слой */}
        {!revealed && (
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="rounded-3xl select-none touch-none cursor-pointer absolute inset-0 w-full h-full"
            style={{
              display: 'block',
              background: 'transparent',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchStart={() => setIsScratching(true)}
            onTouchMove={handleTouch}
            onTouchEnd={handlePointerUp}
          />
        )}

        {/* Маскот + текст — wow‑анимировано */}
        {revealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <KeytoheartMascotPremiumAnimated className="w-24 h-24 mb-2 animate-pop-in" />
            <div
              className="text-[1.35rem] font-bold text-yellow-700 drop-shadow-md text-center animate-fade-in px-2"
              style={{
                fontFamily: "'Golos Text', Arial, sans-serif",
                letterSpacing: 0.18,
                background: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {prediction}
            </div>
          </div>
        )}

        {/* Сияние поверх билета */}
        {revealed && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="w-full h-full bg-gradient-to-br from-white/75 via-transparent to-yellow-100/60 rounded-3xl blur-[2px] animate-fade-in" />
          </div>
        )}
      </div>

      {/* Подсказка “Проведите...” */}
      {!revealed && (
        <div className="mt-2 text-xs text-neutral-500 text-center animate-pulse select-none font-bold px-3" style={{fontFamily: "'Golos Text', Arial, sans-serif"}}>
          Потрите по билетику, чтобы узнать предсказание дня!
        </div>
      )}
    </div>
  );
}
