import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get('level');

    if (!levelParam) {
      return NextResponse.json({ error: 'Le paramètre level est requis' }, { status: 400 });
    }

    const hskLevel = parseInt(levelParam, 10);
    if (isNaN(hskLevel) || hskLevel < 1 || hskLevel > 3) {
      return NextResponse.json({ error: 'Niveau HSK invalide (1, 2 ou 3)' }, { status: 400 });
    }

    // Récupérer toutes les cartes SRS de l'utilisateur pour ce niveau HSK
    const cards = await prisma.sRSCard.findMany({
      where: {
        userId,
        word: {
          hskLevel: hskLevel,
        },
      },
      include: {
        word: true,
      },
      orderBy: {
        word: {
          orderIndex: 'asc',
        },
      },
    });

    return NextResponse.json({
      level: hskLevel,
      totalCards: cards.length,
      cards,
    });
  } catch (error) {
    console.error('Erreur API Session Free :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
