---
title: "Obtenir {name}"
description: "Trois façons d'obtenir {name} : l'essayer sur votre ordinateur, l'installer sur un serveur, ou choisir un hébergement clé en main. Le logiciel est gratuit."
order: 2
group: "Product"
---

{name} est un logiciel libre, sous licence AGPL-3.0-or-later. Le code, chaque version et ses notes sont sur GitHub :

- [Dernière version](https://github.com/Probant-Reporting/probant/releases/latest)
- [Code source](https://github.com/Probant-Reporting/probant)
- [Les nouveautés de chaque version](/whats-new/)

Pas encore décidé ? Suivez la [visite guidée](/tour/), ou faites l'[essai de la page d'accueil](/#try). Dans les deux cas, vous n'installez rien.

## Essayer sur votre ordinateur

C'est un essai, pas une vraie installation. Il sert à faire le tour de l'outil, sur votre ordinateur. Pour votre équipe, installez {name} sur un serveur.

### La version tout-en-un, pour Windows ou Mac

Essayez {name} sur votre ordinateur (essai) : téléchargez la version tout-en-un pour Windows ou Mac, décompressez-la et double-cliquez sur Start. Pour une seule personne, pas pour un travail en équipe ni pour des données à garder.

- [Télécharger la version tout-en-un pour Windows](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-windows.zip)
- [Télécharger la version tout-en-un pour Mac](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-mac.zip)

Au premier démarrage, une fenêtre demande ce que vous voulez essayer :

- **Avec la démo.** Tapez 1. {name} s'ouvre sur Exemplia, une société inventée, avec ses organisations, ses KPI et trois exercices. La fenêtre affiche le compte et son mot de passe.
- **Vide.** Tapez 2. L'assistant de mise en place s'ouvre, et vous mettez en place votre propre structure : vos niveaux, vos organisations, vos KPI.

Pour changer d'avis, double-cliquez sur Reset : il supprime votre essai, et le démarrage suivant repose la question.

### Avec Docker

Il vous faut Docker et Git, sur un Mac ou un ordinateur Linux. Sous Windows, passez par WSL. Vous choisissez à l'étape 2 : avec la démo, ou vide.

1. Récupérez le code et démarrez l'outil :

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ./install.sh
   ```

   Le premier démarrage prend 3 à 5 minutes. Le script affiche l'adresse à ouvrir.

2. Choisissez comment l'outil démarre :

   - **Avec la démo.** Avant d'ouvrir l'adresse, chargez la société de démonstration, Exemplia :

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     La commande affiche les comptes de démonstration et leur mot de passe.

   - **Vide.** Ne lancez rien de plus. Ouvrez l'adresse : l'assistant de mise en place s'ouvre, et sa première étape crée votre compte administrateur.

3. Pour supprimer l'essai et toutes ses données :

   ```bash
   docker compose down -v
   ```

## Installer sur un serveur

Cette partie s'adresse à votre équipe informatique. Il lui faut un serveur Linux 64 bits avec Docker et Git. Elle n'a pas besoin de connaître Python.

1. Récupérez le code et allez dans son dossier :

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Lancez le script d'installation :

   ```bash
   ./install.sh    # ou : ./install.sh --domain reporting.example.com
   ```

   Avec `--domain`, l'outil s'ouvre en HTTPS, et le certificat est créé et renouvelé automatiquement.

3. Ouvrez l'adresse que le script affiche. C'est ici que vous choisissez comment l'outil démarre :

   - **Vide.** C'est ainsi qu'on démarre pour de bon. L'assistant de mise en place s'ouvre, et sa première étape crée le compte administrateur. Faites cette étape tout de suite.

   - **Avec la démo.** Pour une évaluation seulement. Avant d'ouvrir l'adresse, chargez Exemplia, la société de démonstration :

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     Le mot de passe des comptes de démonstration est public : ne laissez pas cette installation ouverte sur internet. Pour démarrer ensuite pour de bon, supprimez l'évaluation et ses données (`docker compose down -v`), puis relancez `./install.sh`.

Pour mettre à jour plus tard, lancez `./update.sh` dans le même dossier. Le script sauvegarde d'abord les données.

L'image Docker de chaque version est aussi publiée sous `ghcr.io/probant-reporting/probant`.

- [Guide d'installation dans le dépôt](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/installation.md)
- Le même guide sur ce site : [Prérequis](/docs/prerequisites/), [Installer l'outil](/docs/install-the-tool/), [Mettre à jour l'outil](/docs/update-the-tool/)

## Hébergement clé en main

Si votre équipe informatique ne veut pas gérer de serveur, un hébergeur peut faire tourner {name}. Le guide décrit Clever Cloud, un hébergeur français. Il fait tourner l'outil, applique les mises à jour de sécurité du système et fournit HTTPS.

- Le déploiement prend environ 30 minutes.
- **Vide.** L'application démarre vide, et l'assistant de mise en place crée le compte administrateur. C'est ainsi qu'on démarre pour de bon.
- **Avec la démo.** Pour une évaluation seulement : aussitôt après le déploiement, ouvrez une console SSH et lancez `python manage.py load_demo`. Le mot de passe des comptes de démonstration est public. Pour démarrer ensuite pour de bon, supprimez l'application et déployez de nouveau.
- Il vous faut un compte Clever Cloud, et les réglages d'un compte e-mail pour les relances.
- Vous créez une application Python à partir du dépôt, avec deux add-ons : PostgreSQL pour la base de données, et FS Bucket pour les fichiers de preuve et les sauvegardes.

Vous payez l'hébergement à l'hébergeur. {name}, lui, reste gratuit.

- [Guide de l'hébergement clé en main dans le dépôt](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/hebergement_cle_en_main.md)
- Le même guide sur ce site : [Hébergement clé en main](/docs/managed-hosting/)

## Être prévenu des nouvelles versions

- Sur GitHub, ouvrez le [dépôt](https://github.com/Probant-Reporting/probant), puis choisissez **Watch › Custom › Releases**. GitHub vous prévient alors de chaque nouvelle version.
- Ou suivez le [flux RSS](/rss.xml) de ce site dans votre lecteur de flux.

Il n'y a ni lettre d'information ni formulaire : ce site ne collecte aucune adresse e-mail.
