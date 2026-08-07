# AGENTS.md — Application d'apprentissage du chinois mandarin

## Vue d'ensemble du projet
Application web d'apprentissage du mandarin multi-utilisateur (usage restreint à un petit groupe privé : l'utilisateur principal et des proches invités), pensée pour un objectif conversationnel (oral/écoute en priorité) avec un squelette de progression HSK 3.0. Fait architectural clé : tout le contenu pédagogique (vocabulaire, phrases, médias) est stocké en base et piloté par un moteur SRS, pas codé en dur dans l'UI.

## Stack technique
- Frontend : Next.js (React), API Routes Next.js (Node.js)
- ORM / Base de données : Prisma + SQLite
- IA : API externe (OpenAI ou Gemini) pour le générateur de phrases et le chatbot explicatif
- Audio : Web Speech API / Edge TTS, ou fichiers MP3 officiels HSK
- Style : CSS Modules, design sombre sobre

## Commandes clés
- Installation : `npm install`
- Lancement dev : `npm run dev`
- Migration base de données : `npx prisma migrate dev`
- Seed des données HSK : `npx prisma db seed`
- Build production : `npm run build`
- Lint : `npm run lint`

## Structure du projet (cible)
```
/prisma          → schéma Prisma + scripts de seed HSK
/app ou /pages    → routes Next.js (UI + API)
/components       → composants React réutilisables
/lib              → logique métier (algorithme SRS, appels IA)
/data             → fichiers sources JSON/CSV du vocabulaire HSK et médias
```

## Conventions de code
- Code simple et lisible, commentaires minimaux (uniquement si la logique n'est pas évidente).
- Un module = une responsabilité claire (ex. : le moteur SRS ne gère pas l'UI de session).
- Toute donnée pédagogique (mots, phrases, structures) va en base ou en fichier de données, jamais codée en dur dans les composants.

## Règles pédagogiques du projet (ne jamais dévier sans validation)
- Mode **reconnaissance uniquement** : jamais de tracé manuscrit, jamais d'exercice d'écriture à la main.
- Répartition du temps : priorité à l'oral et à l'écoute, l'écrit (flashcards) reste un support de mémorisation, pas une fin en soi.
- Session quotidienne = 15 minutes maximum, séquencée ainsi : révision SRS → rappel de structure → nouveau vocabulaire en phrases → shadowing/production.
- Le vocabulaire est toujours appris en contexte de phrase ("sentence mining"), jamais en mot isolé.
- Le squelette de progression suit le HSK 3.0, mais chaque niveau doit être enrichi de vocabulaire "vie réelle" et de contenu culturel (extraits drama/chanson).
- Le diagnostic initial doit détecter les acquis existants (ancien niveau HSK 2) et ne jamais forcer une reprise totale à zéro.

## Limites (Boundaries)

### Toujours faire
- Documenter chaque module terminé (task list / implementation plan) avant de passer au suivant.
- Utiliser des données HSK officielles vérifiables comme source du vocabulaire.
- Tester chaque brique (SRS, session guidée, diagnostic) avant de l'intégrer au module suivant.

### Demander avant
- Changer la stack technique définie ci-dessus.
- Modifier le découpage des 15 minutes de session ou l'ordre des étapes pédagogiques.
- Intégrer du contenu média (drama/chanson) dont la source ou les droits d'usage ne sont pas clairs.

### Ne jamais faire
- Ajouter un module d'écriture manuscrite / tracé des caractères.
- Melanger les données de progression entre utilisateurs : toute donnée de progression (SRS, streak, favoris) doit être strictly isolée par utilisateur, jamais partagée entre comptes.
- Permettre une inscription publique ouverte : l'accès est strictement restreint à un petit groupe privé (l'utilisateur principal et des proches invités).
- Supprimer ou réécrire ce fichier AGENTS.md sans demande explicite.

## Fichiers critiques
- `prisma/schema.prisma` : modèle de données central (Word, SRSCard, Sentence, Media, UserSession).
- `/lib/srs.ts` (ou équivalent) : implémentation de l'algorithme de répétition espacée — cœur fonctionnel de l'app.
- `/data/hsk/*.json` : source de vérité du vocabulaire par niveau HSK, à ne jamais écraser sans sauvegarde.
