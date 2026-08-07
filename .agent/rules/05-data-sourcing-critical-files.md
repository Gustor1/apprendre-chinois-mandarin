# Sourcing des données & Fichiers critiques

## Sourcing des données pédagogiques
- Le vocabulaire HSK doit provenir de listes officielles ou de sources vérifiables de la norme HSK 3.0 (2026), jamais générées de mémoire par un modèle sans vérification.
- Avant tout seeding en base, l'agent doit indiquer explicitement quelle source il utilise pour chaque niveau HSK importé.
- Le contenu du Media Hub (extraits drama/chanson) doit privilégier des liens externes vers des plateformes existantes (ex. YouTube embarqué) plutôt que l'hébergement de fichiers dont les droits ne sont pas clairs, sauf validation explicite au cas par cas.

## Fichiers critiques (à traiter avec prudence)
- `prisma/schema.prisma` : modèle de données central (Word, SRSCard, Sentence, Media, UserSession). Toute modification de structure doit être accompagnée d'une migration Prisma propre, jamais d'une modification manuelle de la base.
- `/lib/srs.ts` (ou équivalent) : implémentation de l'algorithme de répétition espacée (type SM-2) — cœur fonctionnel de l'app, à tester unitairement avant toute intégration UI.
- `/data/hsk/*.json` : source de vérité du vocabulaire par niveau HSK, à ne jamais écraser sans sauvegarde préalable (copie horodatée).
