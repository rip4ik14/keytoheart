// app/cart/utils/stepSummary.tsx
'use client';

import type { ReactNode } from 'react';

type Step = 1 | 2 | 3 | 4 | 5;

type Args = {
  step: Step;
  form: any;
  phone: string;
  postcardText: string;
};

function makeSummaryRow(key: string, label: string, value?: string) {
  const v = (value || '').trim();
  if (!v) return null;

  return (
    <div key={key} className="space-y-1">
      <div className="text-[#b0b0b0]">
        {label}: {v}
      </div>
    </div>
  );
}

function compactPhone(v?: string | null) {
  return (v || '').trim();
}

function formatDateForSummary(v?: string) {
  const s = (v || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function getStepSummary({ step, form, phone, postcardText }: Args): ReactNode | null {
  if (step === 1) {
    const rows = [
      makeSummaryRow('name', 'Ваше имя', form.name),
      makeSummaryRow('phone', 'Ваш телефон', compactPhone(phone || (form as any).phone || '')),
    ].filter(Boolean);

    return rows.length ? <div className="space-y-1">{rows as ReactNode[]}</div> : null;
  }

  if (step === 2) {
    const rows = [
      makeSummaryRow('recipient', 'Имя получателя', form.recipient),
      makeSummaryRow('recipientPhone', 'Телефон получателя', compactPhone(form.recipientPhone || '')),
      makeSummaryRow('postcardText', 'Текст открытки', postcardText || ''),
    ].filter(Boolean);

    return rows.length ? <div className="space-y-1">{rows as ReactNode[]}</div> : null;
  }

  if (step === 3) {
    const delivery = form.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка';
    const rows: ReactNode[] = [];

    if (form.deliveryMethod === 'pickup') {
      rows.push(makeSummaryRow('deliveryMethod', 'Ваш способ доставки', delivery) as ReactNode);
    } else if ((form as any).askAddressFromRecipient) {
      rows.push(makeSummaryRow('address', 'Адрес', 'Адрес уточнить у получателя') as ReactNode);
      rows.push(makeSummaryRow('deliveryMethod', 'Ваш способ доставки', delivery) as ReactNode);
    } else {
      rows.push(makeSummaryRow('street', 'Улица', form.street) as ReactNode);
      rows.push(makeSummaryRow('house', 'Дом', form.house) as ReactNode);
      rows.push(makeSummaryRow('apartment', 'Квартира', form.apartment) as ReactNode);
      rows.push(makeSummaryRow('instructions', 'Пожелания', (form as any).deliveryInstructions || '') as ReactNode);
      rows.push(makeSummaryRow('deliveryMethod', 'Ваш способ доставки', delivery) as ReactNode);
    }

    const cleaned = rows.filter(Boolean);
    return cleaned.length ? <div className="space-y-1">{cleaned}</div> : null;
  }

  if (step === 4) {
    const rows = [
      makeSummaryRow('date', 'Дата', formatDateForSummary(form.date)),
      makeSummaryRow('time', 'Время', form.time || ''),
    ].filter(Boolean);

    return rows.length ? <div className="space-y-1">{rows as ReactNode[]}</div> : null;
  }

  return null;
}
