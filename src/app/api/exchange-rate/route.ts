import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Try fetching live exchange rates from open API
    const res = await fetch('https://open.er-api.com/v6/latest/GBP', {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const tryRate = data?.rates?.TRY;
      if (tryRate && typeof tryRate === 'number') {
        return NextResponse.json({
          success: true,
          rate: tryRate,
          base: 'GBP',
          target: 'TRY',
          source: 'open.er-api.com',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
  }

  // Fallback realistic rate
  return NextResponse.json({
    success: true,
    rate: 44.85,
    base: 'GBP',
    target: 'TRY',
    source: 'fallback',
    timestamp: new Date().toISOString(),
  });
}
