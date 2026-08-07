import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Principales catégories thématiques supportées et ordonnées
const FEATURED_CATEGORIES = [
  { id: 'Transport', name: 'Transport & Véhicules', icon: '🚗' },
  { id: 'Couleurs', name: 'Couleurs & Nuances', icon: '🎨' },
  { id: 'Heure & Moments', name: 'Heure & Moments de la journée', icon: '⏰' },
  { id: 'Météo & Saisons', name: 'Météo & Saisons', icon: '⛅' },
  { id: 'Vêtements', name: 'Vêtements & Accessoires', icon: '👕' },
  { id: 'Position & Espace', name: 'Position dans l’espace', icon: '🗺️' },
  { id: 'Temps relatif', name: 'Temps relatif & Calendrier', icon: '📅' },
  { id: 'Nourriture & Gastronomie', name: 'Nourriture & Gastronomie', icon: '🍲' },
  { id: 'Corps & Santé', name: 'Corps & Santé', icon: '🏥' },
  { id: 'Achats & Argent', name: 'Achats & Argent', icon: '🛒' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    // 1. Si une catégorie spécifique est demandée, renvoyer la liste des mots
    if (categoryParam && categoryParam !== 'all') {
      const words = await prisma.word.findMany({
        where: {
          category: categoryParam,
        },
        include: {
          srsCards: true,
        },
        orderBy: [{ hskLevel: 'asc' }, { orderIndex: 'asc' }, { pinyin: 'asc' }],
      });

      return NextResponse.json({ category: categoryParam, words });
    }

    // 2. Sinon, calculer les compteurs par catégorie thématique
    const categoriesWithStats = await Promise.all(
      FEATURED_CATEGORIES.map(async (cat) => {
        const count = await prisma.word.count({
          where: { category: cat.id },
        });

        const masteredCount = await prisma.sRSCard.count({
          where: {
            word: { category: cat.id },
            status: 'MASTERED',
          },
        });

        return {
          ...cat,
          count,
          masteredCount,
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithStats });
  } catch (error) {
    console.error('Erreur API Thematic GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
