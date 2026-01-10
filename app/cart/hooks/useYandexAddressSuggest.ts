// app/cart/hooks/useYandexAddressSuggest.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';

type Args = {
  onFormChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setAddressError: (v: string) => void;
};

export function useYandexAddressSuggest({ onFormChange, setAddressError }: Args) {
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);

  // load ymaps once
  useEffect(() => {
    let isMounted = true;

    const load = () => {
      if (typeof document === 'undefined') return;
      if (document.querySelector('script[src*="api-maps.yandex.ru"]')) return;

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;

      script.onerror = () => {
        if (isMounted) toast.error('Не удалось загрузить автодополнение адресов');
      };

      document.body.appendChild(script);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAddressSuggestions = useMemo(
    () =>
      debounce((query: string) => {
        if (
          !query.trim() ||
          typeof window === 'undefined' ||
          !(window as any).ymaps ||
          !(window as any).ymaps.ready
        ) {
          return;
        }

        setIsLoadingSuggestions(true);

        (window as any).ymaps.ready(async () => {
          try {
            const response = await (window as any).ymaps!.suggest(query, {
              boundedBy: [
                [45.0, 38.9],
                [45.2, 39.1],
              ],
              strictBounds: true,
              results: 5,
            });

            setAddressSuggestions(response.map((item: any) => item.value));
            setShowSuggestions(true);
          } catch {
            setAddressSuggestions([]);
            setShowSuggestions(false);
          } finally {
            setIsLoadingSuggestions(false);
          }
        });
      }, 300),
    [],
  );

  const handleSelectAddress = useCallback(
    (address: string) => {
      onFormChange({
        target: { name: 'street', value: address },
      } as any);
      setShowSuggestions(false);
      setAddressError('');
    },
    [onFormChange, setAddressError],
  );

  const handleAddressChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onFormChange(e);

      if (value.length > 2) {
        fetchAddressSuggestions(`Краснодар, ${value}`);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [onFormChange, fetchAddressSuggestions],
  );

  return {
    addressSuggestions,
    showSuggestions,
    isLoadingSuggestions,
    handleAddressChange,
    handleSelectAddress,
    setShowSuggestions,
  };
}
