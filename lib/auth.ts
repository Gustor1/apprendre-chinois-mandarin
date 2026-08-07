import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

/**
 * Récupère l'ID de l'utilisateur courant.
 * Si Clerk est configuré et que l'utilisateur est connecté, renvoie son ID Clerk.
 * Sinon, utilise l'en-tête 'x-user-id' ou bascule vers 'user_default' (mode local/dev).
 */
export async function getUserId(): Promise<string> {
  try {
    if (process.env.CLERK_SECRET_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const { userId } = auth();
      if (userId) {
        return userId;
      }
    }

    const headersList = headers();
    const customUserId = headersList.get('x-user-id') || headersList.get('user-id');
    if (customUserId) {
      return customUserId;
    }
  } catch (e) {
    // Ignorer si appelé hors contexte HTTP ou si Clerk n'a pas encore ses clés définies
  }
  return process.env.DEFAULT_USER_ID || 'user_default';
}
