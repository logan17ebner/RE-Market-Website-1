import { NextRequest, NextResponse } from 'next/server';
import { searchCities } from '@/lib/apis/nominatim';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json([]);

  try {
    const results = await searchCities(q);
    return NextResponse.json(results);
  } catch (err) {
    console.error('City search error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
