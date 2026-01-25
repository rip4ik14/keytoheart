// ✅ Путь: components/JivoWidget.tsx
'use client';

import Script from 'next/script';

export default function JivoWidget() {
  return (
    <Script
      id="jivochat-widget"
      src="//code.jivo.ru/widget/c9UvDsGLqB"
      strategy="afterInteractive"
      onLoad={() => {
        // dev-only debug
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[jivo] script loaded');
        }
      }}
    />
  );
}
