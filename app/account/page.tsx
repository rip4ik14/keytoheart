import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';
import AccountClient from './_components/AccountClient';

export const metadata: Metadata = {
  title: 'Личный кабинет | KeyToHeart',
  description: 'Управляйте вашими заказами, бонусами и важными датами в личном кабинете KeyToHeart. Просматривайте историю заказов и получайте бонусы за покупки.',
  keywords: ['личный кабинет', 'KeyToHeart', 'бонусы', 'заказы', 'Краснодар', 'клубничные букеты', 'доставка'],
  openGraph: {
    title: 'Личный кабинет | KeyToHeart',
    description: 'Управляйте заказами, бонусами и важными датами.',
    url: 'https://keytoheart.ru/account',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-account.jpg',
        width: 1200,
        height: 630,
        alt: 'Личный кабинет KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Личный кабинет | KeyToHeart',
    description: 'Управляйте заказами, бонусами и важными датами.',
    images: ['https://keytoheart.ru/og-image-account.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/account' },
};

export const revalidate = 3600; // Обновлять данные каждые 60 минут

export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Получаем номер телефона из cookie
  const authCookie = cookieStore.get('auth');
  let phone: string | null = null;
  let initialOrders: any[] = [];
  let initialBonusData: any = null;

  console.log('All cookies on server:', cookieStore.getAll());
  console.log('Auth cookie on server:', authCookie);

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      if (authData.phone && authData.isAuthenticated) {
        phone = authData.phone;
      }
    } catch (error) {
      console.error('Ошибка парсинга cookie auth:', error);
    }
  }

  console.log('Phone from cookie in AccountPage:', phone);

  if (phone) {
    try {
      const [bonusesRes, ordersRes] = await Promise.all([
        supabase
          .from('bonuses')
          .select('id, bonus_balance, level')
          .eq('phone', phone)
          .single(),
        supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            bonuses_used,
            payment_method,
            status,
            order_items(
              quantity,
              price,
              product_id,
              products(title, image_url)
            )
          `)
          .eq('phone', phone)
          .order('created_at', { ascending: false }),
      ]);

      if (bonusesRes.error && bonusesRes.error.code !== 'PGRST116') {
        throw bonusesRes.error;
      }
      if (ordersRes.error) {
        throw ordersRes.error;
      }

      initialBonusData = bonusesRes.data
        ? { ...bonusesRes.data, history: [] }
        : { id: null, bonus_balance: 0, level: 'basic', history: [] };

      if (initialBonusData?.id) {
        const historyRes = await supabase
          .from('bonus_history')
          .select('amount, reason, created_at')
          .eq('bonus_id', initialBonusData.id);

        if (historyRes.error) {
          throw historyRes.error;
        }
        initialBonusData.history = historyRes.data.map((item) => ({
          amount: item.amount ?? 0,
          reason: item.reason ?? '',
          created_at: item.created_at ?? '',
        }));
      }

      initialOrders = ordersRes.data || [];

      console.log('Initial orders in AccountPage:', initialOrders);
      console.log('Initial bonus data in AccountPage:', initialBonusData);
    } catch (error: any) {
      console.error('Ошибка загрузки данных аккаунта на сервере:', error);
      initialOrders = [];
      initialBonusData = null;
    }
  }

  return (
    <>
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Личный кабинет | KeyToHeart',
          url: 'https://keytoheart.ru/account',
          description: 'Управляйте вашими заказами, бонусами и важными датами в личном кабинете KeyToHeart.',
          mainEntity: {
            '@type': 'Organization',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
          },
        }}
      />
      <AccountClient
        initialSession={null}
        initialOrders={initialOrders}
        initialBonusData={initialBonusData}
      />
    </>
  );
}