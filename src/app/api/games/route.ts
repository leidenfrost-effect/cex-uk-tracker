import { NextResponse } from 'next/server';
import { INITIAL_GAMES } from '@/data/initialGames';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    total: INITIAL_GAMES.length,
    games: INITIAL_GAMES,
    lastUpdated: new Date().toISOString(),
  });
}
