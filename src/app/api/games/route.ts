import { NextRequest, NextResponse } from 'next/server';
import { DatabaseConfigurationError, listGames } from '@/lib/db';
import { AvailabilityFilter, Platform, SortBy } from '@/types/game';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const PLATFORMS = new Set<Platform>(['PS5', 'PS4', 'XBOX_SX', 'XBOX_ONE', 'XBOX_360']);
const SORTS = new Set<SortBy>(['relevance', 'popularity', 'price_asc', 'price_desc', 'title_asc', 'title_desc', 'rating']);
const AVAILABILITY = new Set<AvailabilityFilter>(['store', 'online']);

function positiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function listParam(params: URLSearchParams, key: string, max = 100) {
  return params.getAll(key).flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean).slice(0, max);
}

function priceParam(value: string | null) {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 10000) : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const platformValue = params.get('platform') as Platform | null;
  const sortValue = params.get('sort');
  const ids = params.get('ids')?.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 100);
  const availability = listParam(params, 'availability', 2).filter((value): value is AvailabilityFilter => AVAILABILITY.has(value as AvailabilityFilter));
  try {
    const result = await listGames({
      page: positiveInt(params.get('page'), 1, 10000),
      pageSize: positiveInt(params.get('pageSize'), 48, 5000),
      platform: platformValue && PLATFORMS.has(platformValue) ? platformValue : undefined,
      query: params.get('q')?.trim().slice(0, 100) || undefined,
      minPrice: priceParam(params.get('minPrice')),
      maxPrice: priceParam(params.get('maxPrice')),
      availability: availability.length ? availability : undefined,
      stores: listParam(params, 'store'),
      categories: listParam(params, 'category'),
      ageRatings: listParam(params, 'ageRating'),
      conditions: listParam(params, 'condition'),
      developers: listParam(params, 'developer'),
      genres: listParam(params, 'genre'),
      priceDrops: params.get('priceDrops') === 'true',
      sort: sortValue && SORTS.has(sortValue as SortBy) ? sortValue as SortBy : undefined,
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
