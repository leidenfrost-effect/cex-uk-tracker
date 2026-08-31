import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { migrateUserCollection } from '@/lib/db';
import { UserCollectionDraft } from '@/types/game';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isDraft(value: unknown): value is UserCollectionDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<UserCollectionDraft>;
  return Array.isArray(draft.basket) && Array.isArray(draft.customGames)
    && typeof draft.budgetLimitGbp === 'number'
    && (draft.customExchangeRate === null || typeof draft.customExchangeRate === 'number');
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Hesap senkronizasyonu henüz yapılandırılmadı.' }, { status: 503 });
    }
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    const body: unknown = await request.json();
    const collection = body && typeof body === 'object' ? (body as { collection?: unknown }).collection : undefined;
    if (!isDraft(collection)) return NextResponse.json({ success: false, error: 'Geçersiz koleksiyon verisi.' }, { status: 400 });
    return NextResponse.json({ success: true, collection: await migrateUserCollection(userId, collection) });
  } catch (error) {
    console.error('Collection migration failed:', error);
    return NextResponse.json({ success: false, error: 'Koleksiyon taşınamadı.' }, { status: 503 });
  }
}
