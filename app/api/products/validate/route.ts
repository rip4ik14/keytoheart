import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface CartItem {
  id: number;
  quantity: number;
  price: number; // Цена, которую пользователь видит в корзине (с учётом скидки, если есть)
}

interface ProductValidationResult {
  valid: boolean;
  invalidItems: { id: number; reason: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: { items: CartItem[] } = await req.json();
    process.env.NODE_ENV !== "production" && console.log('Received payload for validation:', body);

    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Не указаны товары для валидации', valid: false, invalidItems: [] }, { status: 400 });
    }

    // Получаем товары из Supabase
    const productIds = items.map(item => item.id);
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, price, in_stock, is_visible, discount_percent')
      .in('id', productIds);

    if (productError) {
      process.env.NODE_ENV !== "production" && console.error('Supabase error fetching products:', productError);
      return NextResponse.json({ error: 'Ошибка получения товаров: ' + productError.message, valid: false, invalidItems: [] }, { status: 500 });
    }

    const invalidItems: { id: number; reason: string }[] = [];

    // Проверяем каждый товар
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        invalidItems.push({ id: item.id, reason: 'Товар не найден' });
        continue;
      }
      if (!product.in_stock) {
        invalidItems.push({ id: item.id, reason: 'Товар отсутствует в наличии' });
        continue;
      }
      if (!product.is_visible) {
        invalidItems.push({ id: item.id, reason: 'Товар не доступен для заказа' });
        continue;
      }

      // Учитываем скидку при валидации цены
      const productPrice = product.price;
      const discountPercent = product.discount_percent || 0;
      const discountedPrice = Math.round(productPrice * (1 - discountPercent / 100));

      if (discountedPrice !== item.price) {
        invalidItems.push({ id: item.id, reason: `Цена изменилась: ожидалась ${item.price}, текущая ${discountedPrice}` });
        continue;
      }
      if (item.quantity <= 0) {
        invalidItems.push({ id: item.id, reason: 'Количество должно быть больше 0' });
        continue;
      }
    }

    const result: ProductValidationResult = {
      valid: invalidItems.length === 0,
      invalidItems,
    };

    process.env.NODE_ENV !== "production" && console.log('Validation result:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in validate API:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message, valid: false, invalidItems: [] }, { status: 500 });
  }
}