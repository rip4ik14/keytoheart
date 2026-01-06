type MiniAppEventPayload = {
  event: string;
  data?: Record<string, any>;
};

export async function sendMiniAppEvent(payload: MiniAppEventPayload) {
  const tg = (window as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';

  // можно дергать и без initData, но тогда сервер отклонит (и это правильно)
  const res = await fetch('/api/tg/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initData,
      event: payload.event,
      data: payload.data || {},
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || 'sendMiniAppEvent failed');
  }

  return json as { ok: true; ticketId: number };
}
