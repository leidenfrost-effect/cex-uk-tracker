import { NextRequest, NextResponse } from 'next/server';
import { getGameHistory } from '@/lib/db';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 365, 1), 2000);
  try {
    const history = await getGameHistory(decodeURIComponent(id), limit);
    return NextResponse.json({ success: true, gameId: id, history });
  } catch (error) {
    console.error('Price history API failed:', error);
    return NextResponse.json({ success: false, error: 'Fiyat geçmişi okunamadı.' }, { status: 503 });
  }
}
