import { NextRequest, NextResponse } from 'next/server';
import { getLatestSyncRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const run = await getLatestSyncRun(request.nextUrl.searchParams.get('runId') || undefined);
    return NextResponse.json({ success: true, run });
  } catch (error) {
    console.error('Sync status API failed:', error);
    return NextResponse.json({ success: false, error: 'Senkronizasyon durumu okunamadı.' }, { status: 503 });
  }
}
