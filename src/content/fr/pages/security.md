---
title: "Sécurité et données"
description: "Où sont vos données, qui peut les voir, les protections actives par défaut et comment fonctionnent les sauvegardes."
order: 1
group: "Trust"
---

Vos données restent sur le serveur que vous choisissez : votre propre serveur avec Docker, ou un hébergement clé en main chez Clever Cloud.

## Qui voit quoi

- Les administrateurs créent les comptes dans l'outil. Il n'y a pas de SSO.
- Chaque personne ne voit que les organisations et les KPI que son rôle permet.
- Le lecteur et l'auditeur ont un accès en lecture seule.
- L'historique garde chaque modification : qui a saisi, modifié ou validé une valeur, et quand.
- Un assistant IA ne peut se connecter que si un administrateur le permet. Il a les mêmes droits que la personne qui le connecte. Chaque appel est noté dans l'historique.
- Un exercice clos reste tel qu'il a été publié : son arbre des organisations et ses chiffres sont gardés.

## Les protections actives par défaut

- Le serveur tourne sans les droits root.
- Une session expire au bout de 12 heures.
- Un fichier de preuve n'est servi qu'après un contrôle des droits. Un lien direct ne suffit pas pour l'ouvrir.
- Après 5 échecs de connexion pour un même identifiant depuis une même adresse, la connexion est refusée pendant 15 minutes.
- L'outil envoie les en-têtes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` et `Referrer-Policy: same-origin`.
- En HTTPS, le certificat est créé et renouvelé automatiquement.

## Sauvegardes

- L'outil se sauvegarde tout seul. Une sauvegarde contient la base de données et les fichiers de preuve.
- Un administrateur peut restaurer une sauvegarde depuis l'outil, après une confirmation.
- Gardez une copie des sauvegardes hors du serveur. C'est votre équipe informatique qui la met en place.

Plus de détails pour l'IT : [Sauvegarder et restaurer](/docs/back-up-and-restore/), [Modifier les réglages](/docs/change-the-settings/).
