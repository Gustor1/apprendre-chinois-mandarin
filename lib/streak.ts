import { prisma } from './db';
import { getUserId } from './auth';

/**
 * Recalcule et met à jour la série (streak) quotidienne d'un utilisateur.
 */
export async function updateDailyStreak(targetUserId?: string) {
  const userId = targetUserId || (await getUserId());

  const streak = await prisma.userStreak.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!streak.lastActiveDate) {
    // Premier jour d'activité
    const updated = await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
      },
    });
    return updated;
  }

  const lastActive = new Date(streak.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - lastActive.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Déjà fait aujourd'hui
    return streak;
  } else if (diffDays === 1) {
    // Consécutif (hier) -> +1 streak
    const newStreak = streak.currentStreak + 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);
    return await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: new Date(),
      },
    });
  } else {
    // Rupture de la série (>1 jour écoulé) -> Reset streak à 1
    return await prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        lastActiveDate: new Date(),
      },
    });
  }
}
