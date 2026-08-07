# Conventions de code

- Code simple et lisible, commentaires minimaux (uniquement si la logique n'est pas évidente au premier coup d'œil).
- Un module = une responsabilité claire (ex. : le moteur SRS ne gère jamais l'UI de session, l'UI de session n'implémente jamais la logique SRS).
- Toute donnée pédagogique (mots, phrases, structures grammaticales) va en base de données ou en fichier de données (`/data`), jamais codée en dur dans les composants React.
- Nommage explicite et cohérent entre le schéma Prisma, les endpoints API et les composants (ex. : `Word`, `SRSCard`, `Sentence` doivent être nommés de façon identique partout).
- Avant d'ajouter une dépendance externe (librairie npm), vérifier qu'elle est activement maintenue et qu'elle ne duplique pas une fonctionnalité déjà couverte par la stack définie dans `01-overview-stack.md`.
