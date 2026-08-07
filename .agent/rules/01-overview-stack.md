# Vue d'ensemble & Stack technique

## Vue d'ensemble du projet
Application web personnelle d'apprentissage du mandarin, usage solo (pas de multi-utilisateur), pensée pour un objectif conversationnel (oral/écoute en priorité) avec un squelette de progression HSK 3.0. Fait architectural clé : tout le contenu pédagogique (vocabulaire, phrases, médias) est stocké en base et piloté par un moteur SRS, pas codé en dur dans l'UI.

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
