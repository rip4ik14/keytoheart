'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

export default function KeytoheartMascotPremiumAnimated({ className = '', style = {} }: { className?: string; style?: any }) {
  // Пульсация сердца
  const heartControls = useAnimation();
  useEffect(() => {
    heartControls.start({
      scale: [1, 1.12, 0.98, 1.08, 1],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [heartControls]);

  // Покачивание ключа
  const keyControls = useAnimation();
  useEffect(() => {
    keyControls.start({
      rotate: [0, -16, 11, 0],
      x: [0, 5, -5, 0],
      y: [0, 1.6, -1.6, 0],
      transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' }
    });
  }, [keyControls]);

  // Сияние на ключе
  const shineControls = useAnimation();
  useEffect(() => {
    shineControls.start({
      opacity: [0, 1, 0],
      scale: [0.7, 1.33, 0.6],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
    });
  }, [shineControls]);

  // Моргание глаз (правый глаз моргает)
  const eyeControls = useAnimation();
  useEffect(() => {
    const blink = async () => {
      while (true) {
        await eyeControls.start({ scaleY: 0.19 }, { duration: 0.11, ease: 'circIn' });
        await eyeControls.start({ scaleY: 1 }, { duration: 0.13, ease: 'circOut', delay: Math.random() * 1.4 + 0.5 });
      }
    };
    blink();
  }, [eyeControls]);

  return (
    <motion.svg
      viewBox="0 0 220 220"
      fill="none"
      className={className}
      style={style}
      initial={{ scale: 0.92, opacity: 0, y: 32 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        filter: 'drop-shadow(0 2px 18px #ffecb8b2)'
      }}
      transition={{ type: 'spring', stiffness: 80, damping: 11, duration: 0.7 }}
    >
      {/* Сияющий круг вокруг сердца */}
      <motion.circle
        cx="110"
        cy="120"
        r="60"
        fill="rgba(255,220,88,0.18)"
        animate={{
          scale: [1, 1.07, 1],
          opacity: [0.33, 0.5, 0.33],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Тень под маскотом */}
      <ellipse cx="110" cy="200" rx="38" ry="10" fill="#dec898" opacity="0.33" />
      {/* Сердце и тело */}
      <motion.g animate={heartControls}>
        {/* КРАСИВОЕ СИММЕТРИЧНОЕ СЕРДЦЕ */}
        <path
          d="
            M110,185
            L58,122
            Q30,92 52,64
            Q73,37 110,63
            Q147,37 168,64
            Q190,92 162,122
            L110,185
            Z
          "
          fill="#E24132"
          stroke="#191716"
          strokeWidth="6"
          style={{ filter: "drop-shadow(0 0 14px #ffd777cc)" }}
        />
        {/* Левая рука */}
        <path
          d="M66 132 Q30 156 50 112"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Правая рука (к ключу) */}
        <path
          d="M154 110 Q210 105 170 90"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Ключ — Четко круглый с зубчиками */}
        <motion.g animate={keyControls}>
          {/* Круглая головка ключа */}
          <ellipse
            cx="176"
            cy="90"
            rx="13"
            ry="13"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="5"
          />
          {/* Вал ключа */}
          <rect
            x="170"
            y="86"
            width="30"
            height="6"
            rx="2"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="3"
          />
          {/* Зубчики ключа */}
          <rect
            x="196"
            y="86"
            width="4"
            height="11"
            rx="1"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="2"
          />
          <rect
            x="201"
            y="86"
            width="4"
            height="7"
            rx="1"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="2"
          />
          {/* Сияние */}
          <motion.circle
            cx="183"
            cy="90"
            r="5"
            fill="#fffbe9"
            opacity={0.7}
            animate={shineControls}
          />
        </motion.g>
        {/* Левая нога */}
        <path
          d="M87 164 Q50 196 80 170 Q65 191 110 175"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Правая нога */}
        <path
          d="M130 171 Q170 200 140 170 Q163 185 110 175"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Глаза */}
        <ellipse
          cx="97"
          cy="115"
          rx="11"
          ry="12"
          fill="#fff"
          stroke="#191716"
          strokeWidth="4"
        />
        <ellipse
          cx="125"
          cy="115"
          rx="11"
          ry="12"
          fill="#fff"
          stroke="#191716"
          strokeWidth="4"
        />
        {/* Зрачки */}
        <ellipse
          cx="102"
          cy="120"
          rx="5"
          ry="6"
          fill="#191716"
        />
        <motion.ellipse
          cx="130"
          cy="120"
          rx="5"
          ry="6"
          fill="#191716"
          animate={eyeControls}
        />
        {/* Улыбка */}
        <path
          d="M104 135 Q110 142 122 135"
          stroke="#191716"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </motion.svg>
  );
}
