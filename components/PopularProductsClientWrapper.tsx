'use client'

import dynamic from 'next/dynamic'
import type { Product } from '@/types/product'

const PopularProductsClient = dynamic(() => import('./PopularProductsClient'), {
  ssr: false,
})

export default function PopularProductsClientWrapper({
  products,
}: {
  products: Product[]
}) {
  return <PopularProductsClient products={products} />
}
