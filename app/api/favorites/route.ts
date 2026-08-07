import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'word' | 'grammar' | 'conversational'
    const level = searchParams.get('level'); // '1' | '2' | '3'
    const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'oldest'

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        word: true,
        grammarStructure: true,
        conversationalItem: true,
      },
      orderBy: {
        createdAt: sort === 'oldest' ? 'asc' : 'desc',
      },
    });

    let filtered = favorites;

    // Filtrer par type
    if (type === 'word') {
      filtered = filtered.filter((f) => f.wordId !== null);
    } else if (type === 'grammar') {
      filtered = filtered.filter((f) => f.grammarStructureId !== null);
    } else if (type === 'conversational') {
      filtered = filtered.filter((f) => f.conversationalItemId !== null);
    }

    // Filtrer par niveau HSK
    if (level) {
      const hskLevel = parseInt(level, 10);
      filtered = filtered.filter((f) => {
        if (f.word) return f.word.hskLevel === hskLevel;
        if (f.grammarStructure) return f.grammarStructure.hskLevel === hskLevel;
        if (f.conversationalItem) return f.conversationalItem.hskLevel === hskLevel;
        return false;
      });
    }

    return NextResponse.json({
      favorites: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Erreur API Favorites GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { wordId, grammarStructureId, conversationalItemId } = body;

    // Déterminer le type et chercher un favori existant pour cet utilisateur
    let existingFavorite = null;

    if (wordId) {
      existingFavorite = await prisma.favorite.findUnique({
        where: { userId_wordId: { userId, wordId } },
      });
    } else if (grammarStructureId) {
      existingFavorite = await prisma.favorite.findUnique({
        where: { userId_grammarStructureId: { userId, grammarStructureId } },
      });
    } else if (conversationalItemId) {
      existingFavorite = await prisma.favorite.findUnique({
        where: { userId_conversationalItemId: { userId, conversationalItemId } },
      });
    } else {
      return NextResponse.json(
        { error: 'Un des champs wordId, grammarStructureId ou conversationalItemId est requis.' },
        { status: 400 }
      );
    }

    // Toggle : supprimer si existant, créer sinon
    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          wordId: wordId || null,
          grammarStructureId: grammarStructureId || null,
          conversationalItemId: conversationalItemId || null,
        },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('Erreur API Favorites POST :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
