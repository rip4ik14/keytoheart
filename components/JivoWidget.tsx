'use client';

import Script from 'next/script';

const JIVO_SRC = '//code.jivo.ru/widget/c9UvDsGLqB';

export default function JivoWidget() {
  return <Script id="jivo-chat" src={JIVO_SRC} strategy="afterInteractive" />;
}
