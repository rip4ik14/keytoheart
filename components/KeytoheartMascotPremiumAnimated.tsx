'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

export default function KeytoheartMascotPremiumAnimated({ className = '', style = {} }: { className?: string; style?: any }) {
  // Пульсация сердца
  const heartControls = useAnimation();
  useEffect(() => {
    heartControls.start({
      scale: [1, 1.13, 0.92, 1.09, 1],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [heartControls]);

  // Покачивание ключа
  const keyControls = useAnimation();
  useEffect(() => {
    keyControls.start({
      rotate: [0, -19, 14, 0],
      x: [0, 6, -6, 0],
      y: [0, 1.6, -1.6, 0],
      transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' }
    });
  }, [keyControls]);

  // Сияние на ключе
  const shineControls = useAnimation();
  useEffect(() => {
    shineControls.start({
      opacity: [0, 1, 0],
      scale: [0.7, 1.39, 0.6],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
    });
  }, [shineControls]);

  // Моргание глаз (правый глаз моргает)
  const eyeControls = useAnimation();
  useEffect(() => {
    const blink = async () => {
      while (true) {
        await eyeControls.start({ scaleY: 0.22 }, { duration: 0.12, ease: 'circIn' });
        await eyeControls.start({ scaleY: 1 }, { duration: 0.13, ease: 'circOut', delay: Math.random() * 1.2 + 0.6 });
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
        <path
          d="M54 82 Q40 38 92 32 Q117 29 133 56 Q170 8 201 66 Q209 83 191 120 L111 195 L39 120 Q10 82 54 82 Z"
          fill="#E24132"
          stroke="#191716"
          strokeWidth="6"
          style={{ filter: "drop-shadow(0 0 14px #ffd777cc)" }}
        />
        {/* Левая рука */}
        <path
          d="M41 126 Q17 142 26 105 Q33 85 49 109"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Правая рука (к ключу) */}
        <path
          d="M180 93 Q218 88 182 72"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Ключ */}
        <motion.g animate={keyControls}>
          <ellipse
            cx="192"
            cy="72"
            rx="11"
            ry="10"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="5"
          />
          <rect
            x="185"
            y="66"
            width="23"
            height="8"
            rx="3.5"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="3"
          />
          <rect
            x="200"
            y="70"
            width="5"
            height="8"
            rx="1.7"
            fill="#FFDF6C"
            stroke="#191716"
            strokeWidth="2"
          />
          {/* Сияние */}
          <motion.circle
            cx="208"
            cy="74"
            r="5"
            fill="#fffbe9"
            opacity={0.7}
            animate={shineControls}
          />
        </motion.g>
        {/* Левая нога */}
        <path
          d="M73 164 Q41 194 64 170 Q57 186 91 170"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Правая нога */}
        <path
          d="M134 173 Q178 195 152 160 Q163 175 121 167"
          fill="none"
          stroke="#191716"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Глаза */}
        <ellipse
          cx="90"
          cy="110"
          rx="11"
          ry="12"
          fill="#fff"
          stroke="#191716"
          strokeWidth="4"
        />
        <ellipse
          cx="141"
          cy="110"
          rx="11"
          ry="12"
          fill="#fff"
          stroke="#191716"
          strokeWidth="4"
        />
        {/* Зрачки */}
        <ellipse
          cx="95"
          cy="115"
          rx="5"
          ry="6"
          fill="#191716"
        />
        <motion.ellipse
          cx="143"
          cy="115"
          rx="5"
          ry="6"
          fill="#191716"
          animate={eyeControls}
        />
        {/* Улыбка */}
        <path
          d="M104 132 Q112 140 129 132"
          stroke="#191716"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </motion.svg>
  );
}
