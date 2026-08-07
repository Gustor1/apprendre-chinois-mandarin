# Plan d'apprentissage du chinois + Cahier des charges pour l'application

## Partie 1 — Plan d'apprentissage (repartir de zéro, objectif oral)

### Principes directeurs
- Reconnaissance uniquement (pas d'ordre des traits, pas de calligraphie) : tu apprends à lire/taper en pinyin, pas à écrire à la main.
- Priorité : compréhension orale > expression orale > lecture > écriture passive (flashcards).
- 15 min/jour, tous les jours, structurées ainsi :
  1. Révision SRS (flashcards dues du jour) — 5 min
  2. Rappel de structure de phrase déjà vue — 3 min
  3. Nouveau vocabulaire / nouvelle structure — 5 min
  4. Écoute courte (dialogue, extrait drama/chanson) liée au point du jour — 2 min
- Système de streak quotidien avec rappel (notification/e-mail) pour maintenir la régularité.
- Un test de niveau initial (diagnostic) permet de ne pas repartir "bêtement" de zéro : il détecte les mots/structures HSK 1 déjà connus et ajuste le point de départ réel dans le curriculum.

### Squelette du parcours (basé sur HSK 3.0, norme 2026)

| Palier | Niveau | Mots cumulés | Caractères lecture | Durée indicative à 15 min/j |
|---|---|---|---|---|
| Débutant | HSK 1 | 300 | ~246 | 4-6 semaines |
| Débutant | HSK 2 | 497 | ~371 | 6-8 semaines |
| Débutant | HSK 3 | 988 | ~655 | 10-12 semaines |
| Intermédiaire | HSK 4 | 1 978 | ~1 096 | 4-6 mois |
| Intermédiaire | HSK 5-6 | jusqu'à 5 334 | jusqu'à 1 940 | ouvert, sans échéance |

Le HSK sert de **squelette de progression** (garantit une base reconnue si un employeur le demande un jour), mais chaque niveau est enrichi de contenu "vie réelle à Shanghai" (transport, resto, WeChat, marchandage) et d'extraits authentiques (drama, chansons, podcasts) dès que le niveau grammatical le permet — dès HSK 1-2 pour des extraits très courts et sous-titrés.

### Rythme hebdomadaire type (une fois lancé)
- Lundi-vendredi : session courte de 15 min (structure ci-dessus).
- Samedi : session "écoute/culture" un peu plus longue si motivé (extrait drama/chanson + 5-10 mots qui en sortent, ajoutés au SRS).
- Dimanche : révision libre / rattrapage du SRS en retard, pas de nouveau contenu.

### Sources de contenu à agréger (déjà identifiées)
- Vocabulaire structuré : listes HSK 3.0 officielles (libres, format CSV/JSON existant)[web:52][web:54].
- Audio/dialogues : type Yoyo Chinese, ChinesePod pour la structure de phrase par niveau[web:11].
- Extraits authentiques : chansons et courts extraits de drama sous-titrés pinyin+traduction.
- Références de flashcards existantes : format compatible Anki pour import initial[web:24].

---

## Partie 2 — Cahier des charges technique (pour Antigravity)

### Contexte du projet
Application web personnelle (pas de compte multi-utilisateur, usage solo sur PC) pour réapprendre le chinois de zéro avec un accent fort sur l'oral, en gardant le fil conducteur HSK 3.0, avec flashcards SRS, suivi de progression, contenu audio/culturel et un chatbot IA d'aide contextuelle.

### Stack technique proposée
- Frontend : Next.js (React) + Tailwind, PWA activable plus tard si besoin mobile.
- Backend : API Node.js (intégrée à Next.js via API routes) ou FastAPI si logique IA plus lourde.
- Base de données : SQLite (usage perso, léger, pas besoin de serveur dédié) ou Supabase si tu veux un accès distant.
- Stockage du contenu : fichiers JSON/CSV pour les listes HSK, dialogues et cartes SRS (facilement éditables/enrichissables à la main).
- IA : appel API à un modèle (Gemini/Claude/GPT) pour deux usages distincts (voir modules ci-dessous).
- Hébergement : Vercel (gratuit, adapté Next.js), accessible normalement en Chine avec VPN.

### Modèle de données (base)
- `words` : caractère, pinyin, traduction FR, niveau HSK, catégorie (vie réelle / examen / culture), audio_url, exemple de phrase.
- `sentences` : structure grammaticale, niveau, exemple audio, mots liés.
- `srs_cards` : word_id, statut (nouveau/en cours/maîtrisé), date_prochaine_révision, facteur de répétition (algorithme type SM-2).
- `sessions` : date, mots révisés, nouveaux mots appris, temps passé, streak.
- `media` : lien vers extrait drama/chanson, niveau, mots ciblés, sous-titres.

### Modules fonctionnels (par priorité)

**Module 1 — Test de niveau initial**
- Questionnaire adaptatif rapide (reconnaissance de mots/caractères HSK 1-2) pour positionner le point de départ réel dans le curriculum sans reprendre des bases totalement maîtrisées.

**Module 2 — Session quotidienne guidée (cœur de l'app)**
- Écran unique séquencé : révision SRS due → rappel de structure → nouveaux mots/structure du jour → mini-écoute liée.
- Timer visible pour respecter les ~15 min.
- Bouton "terminer la session" qui met à jour le streak.

**Module 3 — Flashcards SRS**
- Algorithme de répétition espacée (SM-2 ou variante simple) piloté par les auto-évaluations (facile/moyen/difficile) après chaque carte.
- Reconnaissance uniquement : carte = caractère + pinyin + audio → tu donnes le sens, pas de tracé à dessiner.

**Module 4 — Suivi de progression**
- Tableau de bord : nombre de mots appris/maîtrisés par niveau HSK, streak actuel, temps cumulé, graphique de progression dans le temps.

**Module 5 — Bibliothèque audio/culture**
- Liste d'extraits (drama, chansons, dialogues) filtrable par niveau, avec sous-titres pinyin/traduction et mots cliquables ajoutables directement au SRS.

**Module 6 — Assistant IA (deux fonctions séparées)**
- Sous-module A — Générateur de pratique : crée des phrases d'exemple personnalisées avec le vocabulaire du jour, adaptées au niveau courant.
- Sous-module B — Chatbot explicatif : tu montres/tapes un caractère ou une expression rencontrée ailleurs, l'IA explique son sens, son usage, ses nuances et donne des exemples de phrases dans des contextes oraux réels (pas seulement la traduction littérale).

### Feuille de route de développement (à donner telle quelle à Antigravity)
1. **V1 (MVP)** : modèle de données + import des listes HSK 1-3 + module flashcards SRS + session quotidienne guidée basique + streak.
2. **V2** : test de niveau initial + tableau de bord de progression + bibliothèque audio/culture (contenu manuel au départ).
3. **V3** : intégration des deux sous-modules IA (génération de phrases + chatbot explicatif).
4. **V4 (optionnel)** : PWA pour usage mobile, enrichissement continu du contenu HSK 4-6.

### Prompt de démarrage suggéré pour Antigravity
"Crée une application web Next.js pour l'apprentissage personnel du chinois mandarin, structurée autour du HSK 3.0. Fonctionnalités V1 : import de listes de vocabulaire HSK (JSON), système de flashcards à répétition espacée (algorithme SM-2), session quotidienne guidée de 15 minutes (révision → rappel de structure → nouveau contenu), suivi de streak. Base de données SQLite. Propose d'abord un plan d'implémentation détaillé et vérifiable avant de générer le code complet."
