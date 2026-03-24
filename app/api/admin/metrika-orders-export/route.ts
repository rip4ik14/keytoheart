// ✅ Путь: app/api/admin/metrika-orders-export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

function money(v: any): string {
  if (v === null || v === undefined) return '0';
  if (typeof v === 'object' && v && typeof v.toNumber === 'function') return String(v.toNumber());
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '0';
}

function mapStatus(status: string | null | undefined): string {
  switch (status) {
    case 'delivered':
      return 'PAID';
    case 'canceled':
      return 'CANCELLED';
    case 'pending':
    case 'processing':
    case 'delivering':
      return 'IN_PROGRESS';
    default:
      return 'SPAM';
  }
}

function escapeCsv(value: unknown) {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token || !(await verifyAdminJwt(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const onlyReady = req.nextUrl.searchParams.get('all') !== '1';

  const rows = await prisma.orders.findMany({
    where: onlyReady ? ({ metrika_export_needed: true } as any) : undefined,
    select: {
      id: true,
      order_number: true,
      created_at: true,
      status: true,
      total: true,
      phone: true,
      metrika_client_id: true,
      yclid: true,
      utm_source: true,
      utm_medium: true,
      utm_campaign: true,
      utm_content: true,
      utm_term: true,
      landing_page: true,
      referer: true,
      attribution_source: true,
      is_repeat_order: true,
      metrika_last_export_status: true,
      metrika_status_updated_at: true,
      metrika_export_needed: true,
    } as any,
    orderBy: { created_at: 'desc' },
    take: 5000,
  });

  const header = [
    'order_id',
    'order_number',
    'created_at',
    'status_db',
    'status_metrika',
    'revenue',
    'phone',
    'metrika_client_id',
    'yclid',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'landing_page',
    'referer',
    'attribution_source',
    'is_repeat_order',
    'status_updated_at',
    'export_needed',
  ];

  const lines = [header.join(';')];

  for (const row of rows as any[]) {
    lines.push(
      [
        row.id,
        row.order_number,
        row.created_at ? new Date(row.created_at).toISOString() : '',
        row.status || '',
        row.metrika_last_export_status || mapStatus(row.status),
        money(row.total),
        row.phone || '',
        row.metrika_client_id || '',
        row.yclid || '',
        row.utm_source || '',
        row.utm_medium || '',
        row.utm_campaign || '',
        row.utm_content || '',
        row.utm_term || '',
        row.landing_page || '',
        row.referer || '',
        row.attribution_source || '',
        row.is_repeat_order ? 'true' : 'false',
        row.metrika_status_updated_at ? new Date(row.metrika_status_updated_at).toISOString() : '',
        row.metrika_export_needed ? 'true' : 'false',
      ]
        .map(escapeCsv)
        .join(';'),
    );
  }

  const csv = '\uFEFF' + lines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="metrika-orders-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
