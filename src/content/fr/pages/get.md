---
title: "Obtenir {name}"
description: "Trois façons d'obtenir {name} : l'essayer sur votre ordinateur, l'installer sur un serveur en une commande ou choisir un hébergement clé en main. Le logiciel est gratuit."
order: 2
group: "Product"
replis: true
lead: false
---

{name} est un logiciel libre, sous licence AGPL-3.0-or-later :

- [Dernière version](https://github.com/Probant-Reporting/probant/releases/latest)
- [Code source](https://github.com/Probant-Reporting/probant)
- [Les nouveautés de chaque version](/whats-new/)

## Essayer sur votre ordinateur

### La version tout-en-un, pour Windows ou Mac

Téléchargez-la, décompressez-la, puis lancez Start. Seulement pour découvrir l'outil, pas pour un travail en équipe ni pour des données à garder.

- [Télécharger la version tout-en-un pour Windows](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-windows.zip)
- [Télécharger la version tout-en-un pour Mac](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-mac.zip)

Au premier démarrage, une fenêtre demande ce que vous voulez essayer :

- **Avec la démo.** Tapez 1. {name} s'ouvre sur Exemplia, une société inventée, avec ses organisations, ses KPI et trois exercices. La fenêtre affiche le compte et son mot de passe.
- **Vide.** Tapez 2. L'assistant de mise en place s'ouvre. Vous mettez en place votre propre structure : vos niveaux, vos organisations, vos KPI.

Pour changer d'avis, double-cliquez sur Reset. Il supprime votre essai. Le démarrage suivant repose la question.

La version tout-en-un n'a ni la connexion avec le compte d'entreprise, ni la copie des sauvegardes hors de l'ordinateur, ni les mises à jour automatiques. Un serveur les a.

### Avec Docker

Il vous faut Docker et Git, sur un Mac ou un ordinateur Linux. Sous Windows, passez par WSL.

1. Récupérez le code depuis GitHub et démarrez l'outil :

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

   - **Vide.** Ne lancez rien de plus. Ouvrez l'adresse : l'assistant de mise en place s'ouvre. Sa première étape crée votre compte administrateur.

3. Pour supprimer l'essai et toutes ses données :

   ```bash
   docker compose down -v
   ```

## Installer sur un serveur

Cette partie s'adresse à l'équipe informatique. Il lui faut un serveur Linux 64 bits avec Docker et `curl`. Sur Debian ou Ubuntu, le script d'installation propose d'installer Docker. Avant l'installation, envoyez-lui [Ce qu'il faut préparer](/docs/it-request/) et le [Dossier de sécurité](/docs/security-overview/).

### En une commande

La commande installe la dernière version publiée de {name}, depuis son image signée. Elle contrôle chaque fichier avec la liste signée de la version avant de le mettre en place : sans cette liste, ou si un fichier ne correspond pas, elle n'installe rien. La commande existe à partir de la version 1.1.0 : si la [dernière version](https://github.com/Probant-Reporting/probant/releases/latest) est plus ancienne, installez avec Git (plus bas).

1. Sur le serveur, lancez cette commande dans le dossier qui recevra l'outil, par exemple `/opt` :

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --domain reporting.example.com
   ```

   Avec `--domain`, l'outil s'ouvre en HTTPS, et le certificat est créé et renouvelé automatiquement. Sans cette option, l'outil s'ouvre en HTTP sur le port 8000, pour un réseau interne ou un essai. L'installation prend 2 minutes environ. À la fin, la commande affiche l'adresse à ouvrir et le dossier de l'outil, `probant`.

2. Ouvrez l'adresse. C'est ici que vous choisissez comment l'outil démarre :

   - **Vide.** Pour démarrer pour de bon. L'assistant de mise en place s'ouvre. Sa première étape crée le compte administrateur. Faites cette étape tout de suite.

   - **Avec la démo.** Pour une évaluation seulement. Avant d'ouvrir l'adresse, chargez Exemplia, la société de démonstration, dans le dossier `probant` :

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     Le mot de passe des comptes de démonstration est public : ne laissez pas cette installation ouverte sur internet. Pour démarrer ensuite pour de bon, supprimez l'évaluation et ses données (`docker compose down -v`), puis lancez `./install.sh` dans le même dossier.

Après cette installation, le serveur installe chaque nouvelle version la nuit, 3 jours après sa publication. Il sauvegarde d'abord les données, et revient à la version précédente si la nouvelle ne répond pas. Dans l'outil, un gestionnaire des espaces peut choisir **Prévenir seulement** ou **Éteint** à la place. Pour installer sans les mises à jour automatiques, ajoutez `--auto-update off` à la commande.

### Contrôler d'abord le serveur

Le contrôle lit Docker, la mémoire, le disque, les ports, le nom de domaine, le réseau et l'horloge. Il dit ce qui manque et ne change rien. Le script d'installation fait le même contrôle avant une nouvelle installation.

```bash
curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --check --domain reporting.example.com
```

### Sans accès à Internet

Chaque version a un paquet hors ligne sur sa page de release, à partir de la version 1.1.0 : l'image de l'outil, l'image de Caddy pour HTTPS et les fichiers d'installation, signés. Docker doit déjà être sur le serveur. Copiez le paquet sur le serveur, décompressez-le, puis lancez `./install.sh --offline` avec l'archive de l'image. Le paquet ne contient pas PostgreSQL. Voir [Installer sans accès à Internet](/docs/install-the-tool/#installer-sans-accès-à-internet).

### Sur le réseau d'une entreprise

Caddy peut servir le certificat HTTPS de votre entreprise (`--cert` et `--key`), sans Let's Encrypt et sans accès depuis internet. L'outil peut aussi faire confiance à l'autorité de certification de votre entreprise pour ses connexions sortantes, par exemple vers votre serveur d'e-mails (`--ca-cert`). Voir [Réseau d'entreprise](/docs/install-the-tool/#réseau-dentreprise).

### Avec Git

Passez par Git sur un serveur `arm64` (l'image publiée est pour `x86_64`), ou pour suivre le code avec `git pull`. Le serveur construit l'image : 3 à 5 minutes.

```bash
git clone https://github.com/Probant-Reporting/probant.git probant
cd probant
./install.sh    # ou : ./install.sh --domain reporting.example.com
```

### Après l'installation

- Pour mettre à jour à la main, lancez `./update.sh` dans le dossier de l'outil. Le script sauvegarde d'abord chaque espace.
- Les e-mails, les alertes par e-mail et la copie des sauvegardes hors du serveur se règlent dans l'outil, dans **Administration › Paramètres**, par un gestionnaire des espaces. L'IT donne les réglages d'un compte e-mail, et un stockage (compatible S3 ou SFTP) pour la copie. Sur une installation neuve, les alertes par e-mail sont allumées dès que les e-mails sont réglés.
- La connexion avec le compte d'entreprise (OpenID Connect) est éteinte par défaut. Un gestionnaire des espaces l'allume. Voir [Se connecter avec le compte d'entreprise](/docs/single-sign-on/).

L'image Docker de chaque version est aussi publiée sous `ghcr.io/probant-reporting/probant`, avec sa signature et sa liste de composants. Voir [Vérifier l'image](/docs/install-the-tool/#vérifier-limage).

- [Guide d'installation dans le dépôt](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/installation.md)
- Le même guide sur ce site : [Prérequis](/docs/prerequisites/), [Installer l'outil](/docs/install-the-tool/), [Mettre à jour l'outil](/docs/update-the-tool/)

## Hébergement clé en main

Si votre équipe informatique ne veut pas gérer de serveur, un hébergeur peut faire tourner {name}. Le guide décrit Clever Cloud, un hébergeur français. Il fait tourner l'outil, applique les mises à jour de sécurité du système et fournit HTTPS.

- Le déploiement prend environ 30 minutes.
- **Vide.** Pour démarrer pour de bon. L'application démarre vide et l'assistant de mise en place crée le compte administrateur.
- **Avec la démo.** Pour une évaluation seulement : aussitôt après le déploiement, ouvrez une console SSH et lancez `python manage.py load_demo`. Le mot de passe des comptes de démonstration est public. Pour démarrer ensuite pour de bon, supprimez l'application et déployez de nouveau.
- Il vous faut un compte Clever Cloud et les réglages d'un compte e-mail pour les relances.
- Vous créez une application Python à partir du dépôt, avec deux add-ons : PostgreSQL pour la base de données, et FS Bucket pour les fichiers de preuve et les sauvegardes.
- Pour mettre à jour, vous déployez de nouveau la nouvelle version. Les mises à jour automatiques d'un serveur n'existent pas en hébergement clé en main.

Vous payez l'hébergement à l'hébergeur. {name} reste gratuit.

- [Guide de l'hébergement clé en main dans le dépôt](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/hebergement_cle_en_main.md)
- Le même guide sur ce site : [Hébergement clé en main](/docs/managed-hosting/)

## De votre ordinateur à un serveur

Vous avez essayé la version tout-en-un et saisi de vraies données ? Vous pouvez les passer sur un serveur sans rien perdre : comptes et mots de passe, valeurs, preuves et paramètres.

1. Fermez la fenêtre de l'outil.
2. Faites un fichier `.zip` du dossier `data`, à côté de Start.
3. Remettez-le à votre équipe informatique de façon sûre, par exemple sur une clé USB. Pas dans un e-mail ordinaire : il contient toutes vos données.

Votre équipe informatique se sert de ce dossier comme données du nouveau serveur. Une démo ne se déplace pas : ses comptes ont un mot de passe public. Voir [De la version tout-en-un à un serveur](/docs/from-pc-to-server/).

## Être prévenu des nouvelles versions

- Sur GitHub, ouvrez le [dépôt](https://github.com/Probant-Reporting/probant), puis choisissez **Watch › Custom › Releases**. GitHub vous prévient alors de chaque nouvelle version.
- Ou suivez le [flux RSS](/rss.xml) de ce site dans votre lecteur de flux.

Il n'y a ni lettre d'information ni formulaire : ce site ne collecte aucune adresse e-mail.
