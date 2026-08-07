import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'word' | 'grammar' | 'conversational' | 'all'
    const level = searchParams.get('level'); // '1' | '2' | '3' | 'all'

    // Récupérer les favoris de l'utilisateur avec leurs relations et leurs cartes SRS
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        word: {
          include: {
            srsCards: {
              where: { userId },
            },
          },
        },
        grammarStructure: true,
        conversationalItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let filtered = favorites;

    // Filtrer par type
    if (type && type !== 'all') {
      if (type === 'word') {
        filtered = filtered.filter((f) => f.wordId !== null);
      } else if (type === 'grammar') {
        filtered = filtered.filter((f) => f.grammarStructureId !== null);
      } else if (type === 'conversational') {
        filtered = filtered.filter((f) => f.conversationalItemId !== null);
      }
    }

    // Filtrer par niveau HSK
    if (level && level !== 'all') {
      const hskLevel = parseInt(level, 10);
      filtered = filtered.filter((f) => {
        if (f.word) return f.word.hskLevel === hskLevel;
        if (f.grammarStructure) return f.grammarStructure.hskLevel === hskLevel;
        if (f.conversationalItem) return f.conversationalItem.hskLevel === hskLevel;
        return false;
      });
    }

    // Formater en cartes unifiées pour le mode flashcard
    const cards = filtered
      .map((fav) => {
        if (fav.word) {
          const w = fav.word;
          const srsCard = w.srsCards && w.srsCards.length > 0 ? w.srsCards[0] : null;
          return {
            favoriteId: fav.id,
            type: 'word' as const,
            id: w.id,
            cardId: srsCard?.id || null,
            title: `Mot (HSK ${w.hskLevel})`,
            character: w.character,
            pinyin: w.pinyin,
            meaning: w.meaning,
            pattern: null,
            hskLevel: w.hskLevel,
            category: w.category || 'Vocabulaire',
            explanation: null,
            exampleSentence: w.exampleSentence,
            examplePinyin: w.examplePinyin,
            exampleTranslation: w.exampleTranslation,
          };
        }

        if (fav.grammarStructure) {
          const g = fav.grammarStructure;
          return {
            favoriteId: fav.id,
            type: 'grammar' as const,
            id: g.id,
            cardId: null,
            title: g.title,
            character: g.pattern,
            pinyin: '',
            meaning: g.explanation.length > 60 ? g.explanation.substring(0, 60) + '...' : g.explanation,
            pattern: g.pattern,
            hskLevel: g.hskLevel,
            category: 'Grammaire',
            explanation: g.explanation,
            exampleSentence: g.exampleSentence,
            examplePinyin: g.examplePinyin,
            exampleTranslation: g.exampleTranslation,
          };
        }

        if (fav.conversationalItem) {
          const c = fav.conversationalItem;
          return {
            favoriteId: fav.id,
            type: 'conversational' as const,
            id: c.id,
            cardId: null,
            title: c.title,
            character: c.spokenForm || c.pattern || c.title,
            pinyin: c.examplePinyin ? c.examplePinyin.split(' ')[0] : '',
            meaning: c.meaning,
            pattern: c.pattern || null,
            hskLevel: c.hskLevel,
            category: c.theme || 'Chinois Quotidien',
            explanation: c.explanation || null,
            exampleSentence: c.exampleSentence,
            examplePinyin: c.examplePinyin,
            exampleTranslation: c.exampleTranslation,
          };
        }

        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      cards,
      total: cards.length,
    });
  } catch (error) {
    console.error('Erreur API Favorites Session GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
