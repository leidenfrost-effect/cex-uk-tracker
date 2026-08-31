import { NextRequest, NextResponse } from 'next/server';
import { getTrends } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 12, 1), 50);
  try {
    return NextResponse.json({ success: true, ...(await getTrends(limit)) });
  } catch (error) {
    console.error('Trends API failed:', error);
    return NextResponse.json({ success: false, error: 'Trend verisi okunamadı.' }, { status: 503 });
  }
}
