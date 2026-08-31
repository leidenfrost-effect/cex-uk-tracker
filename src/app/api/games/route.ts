import { NextRequest, NextResponse } from 'next/server';
import { DatabaseConfigurationError, listGames } from '@/lib/db';
import { Platform } from '@/types/game';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const PLATFORMS = new Set<Platform>(['PS5', 'PS4', 'XBOX_SX', 'XBOX_ONE', 'XBOX_360']);
const SORTS = new Set(['price_asc', 'price_desc', 'discount', 'title', 'rating']);

function positiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const platformValue = params.get('platform') as Platform | null;
  const sortValue = params.get('sort');
  const maxPriceValue = params.get('maxPrice');
  const ids = params.get('ids')?.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 100);
  try {
    const result = await listGames({
      page: positiveInt(params.get('page'), 1, 10000),
      pageSize: positiveInt(params.get('pageSize'), 48, 5000),
      platform: platformValue && PLATFORMS.has(platformValue) ? platformValue : undefined,
      query: params.get('q')?.trim().slice(0, 100) || undefined,
      maxPrice: maxPriceValue !== null && Number.isFinite(Number(maxPriceValue)) ? Number(maxPriceValue) : undefined,
      inStock: params.get('inStock') === 'true',
      priceDrops: params.get('priceDrops') === 'true',
      sort: sortValue && SORTS.has(sortValue) ? sortValue as 'price_asc' : undefined,
      ids,
      includeMeta: params.get('includeMeta') === 'true',
    });
    return NextResponse.json({ success: true, ...result }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Games API failed:', error);
    const message = error instanceof DatabaseConfigurationError
      ? 'Veritabanı henüz yapılandırılmadı.' : 'Katalog verisi okunamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
