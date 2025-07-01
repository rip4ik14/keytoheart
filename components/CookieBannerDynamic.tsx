'use client'

import dynamic from 'next/dynamic'

const CookieBanner = dynamic(() => import('./CookieBanner'), {
  ssr: false,
  loading: () => null,
})

export default CookieBanner
