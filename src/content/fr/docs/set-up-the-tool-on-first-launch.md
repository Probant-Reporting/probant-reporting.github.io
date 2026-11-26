---
title: "Mettre en place l'outil au premier lancement"
description: "À la première ouverture, l'outil n'a encore aucun compte. L'assistant Mise en place s'ouvre à la place de la page de connexion. Il compte 8 étapes."
order: 3
group: "Get started"
source: "docs/fr/installation.md"
---

À la première ouverture, l'outil n'a encore aucun compte. L'assistant **Mise en place** s'ouvre à la place de la page
de connexion. Il compte 8 étapes.

> **Important : créez le compte administrateur tout de suite.** Tant que l'étape 1 n'est pas faite, la première
> personne qui ouvre l'adresse de l'outil crée le compte administrateur. Après l'étape 1, l'assistant ne s'ouvre plus
> qu'à ce compte.

L'outil ne demande aucun code d'installation. Tant que rien n'est créé, l'outil ne contient aucune donnée sensible.
Ce qui le protège, c'est l'ordre des étapes : vous créez le compte administrateur juste après l'installation, avant de
communiquer l'adresse.

Pour mettre en place l'outil :

1. Juste après l'installation (ou le déploiement), ouvrez l'adresse de l'outil. L'assistant **Mise en place**
   s'ouvre. Pour voir plutôt la démo, chargez-la maintenant, avant l'étape 1 : voir « Démarrer vide, ou avec la
   démo ».
2. Faites l'étape 1, **Compte administrateur**, avant de communiquer l'adresse.
3. Faites les autres étapes, ou donnez l'adresse à la personne qui fait la mise en place.

Si l'étape 1 doit attendre, laissez l'outil inaccessible depuis Internet jusque-là. Par exemple, ne réglez pas encore
le nom de domaine.

Ce tableau présente les 8 étapes de l'assistant :

| Étape | Nom | Ce que vous réglez |
|---|---|---|
| 1 | **Compte administrateur** | Le compte de l'administrateur |
| 2 | **Votre structure** | Le nom, le logo et les couleurs de l'outil |
| 3 | **Langues** | La langue par défaut et les langues des contenus |
| 4 | **Organisation** | Les niveaux de l'arbre et les organisations |
| 5 | **Référentiels** | Les référentiels KPI : les KPI à collecter |
| 6 | **Fiche KPI** | Les catégories de description, les unités, les types et les champs |
| 7 | **Équipe** | Les comptes des contributeurs et des validateurs |
| 8 | **Première campagne** | La période, les dates et l'ouverture de la saisie |

Vous pouvez vous arrêter et reprendre plus tard. La personne qui fait la mise en place n'a pas besoin de l'équipe
informatique, sauf pour les e-mails (section 7).

Le compte de l'étape 1 est aussi le premier **gestionnaire des espaces**. Seuls les gestionnaires des espaces changent
les réglages de toute l'installation : le serveur d'e-mails, les alertes par e-mail, les mises à jour automatiques, la
copie externe des sauvegardes et la connexion d'entreprise. Les autres administrateurs ne peuvent pas les changer. Voir
docs/spaces.md (en anglais).

Après la mise en place, chaque personne se connecte avec son adresse e-mail. Le **Tableau de bord** montre
l'avancement de la collecte :

La saisie fonctionne aussi sur téléphone :

## Démarrer vide, ou avec la démo

Une nouvelle installation est vide : vous mettez en place votre propre structure avec l'assistant. C'est la façon de
démarrer pour de bon.

Pour d'abord faire le tour de l'outil, vous pouvez charger la démo à la place : Exemplia, une société fictive, avec
ses organisations, ses KPI et trois exercices. Faites-le avant l'étape 1 de l'assistant, sur la base vide :

```bash
docker compose exec web python manage.py load_demo
```

La commande affiche les comptes de démonstration et leur mot de passe.

> **Important :** le mot de passe des comptes de démonstration est public. Ne chargez la démo que sur une installation
> qui sert à une évaluation, et ne la laissez pas ouverte sur internet. La commande refuse une base qui contient déjà
> vos données. Pour démarrer ensuite pour de bon, supprimez l'évaluation et ses données (`docker compose down -v`),
> puis installez de nouveau : l'outil démarre vide.
