import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const themeParam = searchParams.get('theme');

    const whereClause: any = {};

    if (typeParam && typeParam !== 'all') {
      whereClause.type = typeParam.toUpperCase();
    }

    if (themeParam && themeParam !== 'all') {
      whereClause.theme = themeParam;
    }

    const items = await prisma.conversationalItem.findMany({
      where: whereClause,
      orderBy: [{ type: 'asc' }, { hskLevel: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Erreur API Conversational GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'ID de l’élément requis' }, { status: 400 });
    }

    const convItem = await prisma.conversationalItem.findUnique({
      where: { id: itemId },
    });

    if (!convItem) {
      return NextResponse.json({ error: 'Expression conversationnelle non trouvée' }, { status: 404 });
    }

    // Caractère à ajouter au SRS (forme orale ou patron)
    const charToStudy = convItem.spokenForm || convItem.pattern || convItem.title;
    const pinyinText = convItem.examplePinyin.split(' ')[0] || convItem.title;

    // 1. Rechercher si le mot existe déjà ou le créer
    let word = await prisma.word.findFirst({
      where: { character: charToStudy },
    });

    if (!word) {
      word = await prisma.word.create({
        data: {
          character: charToStudy,
          pinyin: pinyinText,
          meaning: convItem.meaning,
          hskLevel: convItem.hskLevel,
          category: 'Chinois Quotidien',
          orderIndex: 9999,
          exampleSentence: convItem.exampleSentence,
          examplePinyin: convItem.examplePinyin,
          exampleTranslation: convItem.exampleTranslation,
        },
      });
    }

    // 2. Créer la carte SRS pour cet utilisateur si elle n'existe pas encore
    const userId = await getUserId();
    const existingCard = await prisma.sRSCard.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId: word.id,
        },
      },
    });

    if (!existingCard) {
      await prisma.sRSCard.create({
        data: {
          userId,
          wordId: word.id,
          status: 'NEW',
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date(),
        },
      });
    }

    // 3. Marquer l'expression comme inSRS = true
    const updatedItem = await prisma.conversationalItem.update({
      where: { id: itemId },
      data: { inSRS: true },
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Erreur API Conversational POST :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
