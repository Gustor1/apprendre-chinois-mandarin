# Limites (Boundaries)

Ces règles définissent le niveau d'autonomie de l'agent. Elles doivent être consultées avant toute action ambiguë.

## Toujours faire (autonomie totale)
- Documenter chaque module terminé (task list / implementation plan / walkthrough) avant de passer au module suivant.
- Utiliser des données HSK officielles vérifiables comme source du vocabulaire, en citant leur provenance dans `/data`.
- Tester chaque brique fonctionnelle (moteur SRS, session guidée, diagnostic, assistant IA) avant de l'intégrer au module suivant.
- Respecter strictement les règles listées dans `02-pedagogy-rules.md` sans les réinterpréter.

## Demander avant d'agir
- Changer la stack technique définie dans `01-overview-stack.md`.
- Modifier le découpage des 15 minutes de session ou l'ordre des étapes pédagogiques.
- Intégrer du contenu média (extrait de drama/chanson) dont la source ou les droits d'usage ne sont pas clairs.
- Ajouter une dépendance externe majeure non prévue initialement.

## Ne jamais faire (interdiction stricte)
- Ajouter un module d'écriture manuscrite / tracé des caractères.
- Melanger les données de progression entre utilisateurs : toute donnée de progression (SRS, streak, favoris) doit être strictement isolée par utilisateur, jamais partagée entre comptes.
- Permettre une inscription publique ouverte : l'accès est strictement restreint à un petit groupe privé (l'utilisateur principal et quelques proches invités individuellement).
- Supprimer ou réécrire les fichiers du dossier `.agent/rules/` sans demande explicite de l'utilisateur.
- Remplacer ou effacer les données déjà présentes dans `/data/hsk/` sans sauvegarde préalable.
