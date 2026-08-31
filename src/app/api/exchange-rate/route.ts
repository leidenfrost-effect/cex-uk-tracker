import { NextResponse } from 'next/server';
import { DatabaseConfigurationError, getLatestExchangeRate } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const rate = await getLatestExchangeRate();
    if (!rate) return NextResponse.json({ success: false, error: 'Henüz kur kaydı yok.' }, { status: 404 });
    return NextResponse.json({ success: true, ...rate });
  } catch (error) {
    console.error('Exchange rate API failed:', error);
    const message = error instanceof DatabaseConfigurationError
      ? 'Veritabanı henüz yapılandırılmadı.' : 'Kur verisi okunamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
