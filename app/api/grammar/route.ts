import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get('level');

    const whereClause: any = {};

    if (levelParam && levelParam !== 'all') {
      whereClause.hskLevel = parseInt(levelParam, 10);
    }

    const structures = await prisma.grammarStructure.findMany({
      where: whereClause,
      orderBy: [{ hskLevel: 'asc' }, { title: 'asc' }],
    });

    return NextResponse.json({ structures });
  } catch (error) {
    console.error('Erreur API Grammar :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
