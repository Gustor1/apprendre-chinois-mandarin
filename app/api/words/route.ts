import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get('level');
    const queryParam = searchParams.get('query');

    const whereClause: any = {};

    if (levelParam && levelParam !== 'all') {
      whereClause.hskLevel = parseInt(levelParam, 10);
    }

    if (queryParam) {
      whereClause.OR = [
        { character: { contains: queryParam } },
        { pinyin: { contains: queryParam } },
        { meaning: { contains: queryParam } },
      ];
    }

    const words = await prisma.word.findMany({
      where: whereClause,
      include: {
        srsCards: true,
      },
      orderBy: [{ hskLevel: 'asc' }, { orderIndex: 'asc' }, { pinyin: 'asc' }],
    });

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Erreur API Words :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
