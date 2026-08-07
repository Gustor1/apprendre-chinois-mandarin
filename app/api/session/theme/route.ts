import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    if (!categoryParam) {
      return NextResponse.json({ error: 'Le paramètre category est requis' }, { status: 400 });
    }

    const cards = await prisma.sRSCard.findMany({
      where: {
        userId,
        word: {
          category: categoryParam,
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
      category: categoryParam,
      totalCards: cards.length,
      cards,
    });
  } catch (error) {
    console.error('Erreur API Session Theme :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
