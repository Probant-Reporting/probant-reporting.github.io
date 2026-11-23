---
title: "Hébergement clé en main"
description: "Ce guide explique comment installer et faire tourner l'outil chez un hébergeur clé en main, sans serveur à gérer."
order: 2.5
group: "Get started"
source: "docs/fr/hebergement_cle_en_main.md"
---

Ce guide explique comment installer et faire tourner l'outil chez un hébergeur clé en main, sans serveur à gérer.

C'est l'option « sans serveur ». L'hébergeur fait tourner l'outil, applique les mises à jour de sécurité du système et
fournit HTTPS. L'IT n'a ni machine ni Docker à gérer.

## Choisir un hébergeur

Chez ces hébergeurs, **le disque de l'application est effacé à chaque déploiement**. Pour cette raison, les preuves
déposées, le logo et les sauvegardes doivent aller dans un stockage qui dure.

Le tableau compare les deux hébergeurs étudiés :

| Hébergeur | Base | Fichiers déposés (preuves, logo) | Verdict |
|---|---|---|---|
| **Clever Cloud** (France) | Add-on PostgreSQL | **FS Bucket** : un dossier persistant monté dans l'application (mode Python, pas Docker) | **Recommandé** : l'outil fonctionne tel quel |
| Scalingo (France) | Add-on PostgreSQL | Pas de dossier persistant : un stockage objet (S3) est nécessaire, et l'outil ne le gère pas encore | Pas en version 1.0 |

La documentation de référence de Clever Cloud :

- [Application Python](https://developers.clever-cloud.com/doc/applications/python)
- [FS Buckets](https://developers.clever-cloud.com/doc/addons/fs-bucket)
- [Variables d'environnement](https://www.clever-cloud.com/doc/reference/reference-environment-variables/)

Le panneau de chaque add-on, dans la console, affiche les noms exacts de ses variables. Vérifiez-les, car la
plateforme évolue.

## Déployer sur Clever Cloud

Le déploiement prend environ 30 minutes.

### Avant de commencer

Il vous faut :

- Un compte Clever Cloud
- Les réglages du serveur d'e-mails (SMTP) qui envoie les relances et les e-mails de test

### Créer l'application et ses add-ons

Pour créer l'application :

1. Dans la console Clever Cloud, cliquez sur **Create** › **an application** › **Python**.
2. Choisissez le déploiement depuis le dépôt GitHub (ou par `git push` vers Clever Cloud).
3. Choisissez la branche `main` et la région Paris.
4. Ajoutez l'add-on **PostgreSQL** et liez-le à l'application. La petite offre suffit pour quelques dizaines
   d'utilisateurs.
5. Ajoutez l'add-on **FS Bucket** et liez-le à l'application. Il garde les preuves, le logo, les sauvegardes et la clé
   secrète.

### Régler les variables d'environnement

Pour régler les variables de l'application :

1. Ouvrez l'onglet **Environment variables**, en mode expert.
2. Saisissez ces lignes. Remplacez les valeurs entre chevrons et les `…` par vos propres valeurs.

   ```
   CC_PYTHON_VERSION=3.12
   CC_PYTHON_BACKEND=gunicorn
   CC_PYTHON_MODULE=config.wsgi:application
   CC_PYTHON_MANAGE_TASKS=collectstatic --noinput, startup
   CC_FS_BUCKET=/data:<hôte du FS Bucket, affiché dans son panneau>
   CC_WORKER_COMMAND_0=python manage.py backup --schedule
   CC_WORKER_COMMAND_1=python manage.py send_reminders --schedule
   CC_WORKER_COMMAND_2=python manage.py check_data --schedule
   CC_WORKER_COMMAND_3=python manage.py run_imports --schedule
   DATA_DIR=data
   DJANGO_DEBUG=0
   DJANGO_HTTPS=1
   DOMAIN=<app-xxxx>.cleverapps.io
   SMTP_HOST=…
   SMTP_PORT=587
   SMTP_SECURITY=starttls
   SMTP_USER=…
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

L'outil accepte encore les anciens noms français des variables, comme `DOSSIER_DONNEES` ou `SMTP_HOTE`.

Le tableau indique ce que règlent ces lignes :

| Réglage | Effet |
|---|---|
| `DATA_DIR=data` et `CC_FS_BUCKET=/data:…` | Les données vont dans le dossier `data` du projet, qui est le FS Bucket. |
| `CC_PYTHON_MANAGE_TASKS` | Lance la même préparation que l'image Docker : fichiers statiques, sauvegarde automatique si la base doit changer, et migrations. |
| Base de données | Vous n'écrivez aucune variable. L'outil lit `POSTGRESQL_ADDON_URI`, que l'add-on fournit. Si l'add-on donne un autre nom, écrivez `DATABASE_URL=postgres://…` avec la valeur de l'add-on. |
| `CC_WORKER_COMMAND_…` | Ces tâches tournent à côté du site : la sauvegarde quotidienne, les relances automatiques, le contrôle des données de chaque nuit et les gros imports de valeurs. |
| `CC_WORKER_COMMAND_2` | Le contrôle des données lit seulement la base et vérifie sa cohérence, à `DATA_CHECK_TIME` (03:30 par défaut). Au même moment, le ménage de la nuit efface les sessions terminées et les anciens éléments supprimés. |
| `CC_WORKER_COMMAND_3` | Fait les gros imports de valeurs, au-delà de `BACKGROUND_IMPORT_ROWS` lignes (5 000 par défaut), et les gros exports (seuil dans **Paramètres › Hébergement**). L'outil affiche une barre d'avancement. Sans ce worker, le site fait lui-même les gros imports, ce qui est moins robuste à un redémarrage. |
| `DOMAIN` | Le nom en `cleverapps.io`, ou votre propre nom de domaine après l'avoir ajouté dans l'onglet **Domain names**. Clever Cloud fournit HTTPS. |
| `TIME_ZONE` (facultatif) | Le fuseau horaire de l'installation, `Europe/Brussels` par défaut. Écrivez un nom IANA, par exemple `TIME_ZONE=America/New_York`. L'heure des relances, de la sauvegarde et du contrôle des données, et les dates des exports le suivent. Si le nom est inconnu, l'outil ne démarre pas. |

Si votre offre n'a pas de workers, utilisez les tâches planifiées (« cron ») de Clever Cloud avec ces commandes :

- `python manage.py backup`
- `python manage.py send_reminders --auto`
- `python manage.py check_data`

`send_reminders --auto` n'envoie les relances d'un espace qu'une fois par jour : un second lancement le même jour
n'envoie rien (`--simulation` dit toujours qui serait relancé).

### Déployer et créer le compte administrateur

> **Important :** sur une base vide, le premier visiteur de l'adresse de l'application crée le compte administrateur.
> Faites les étapes 2 et 3 aussitôt après le déploiement.

L'application démarre vide : c'est la façon de démarrer pour de bon. Pour d'abord faire le tour de l'outil avec la
démo (Exemplia, une société fictive), ouvrez une console SSH (`clever ssh`) aussitôt après le déploiement, avant
l'étape 2, et lancez `python manage.py load_demo`. La commande affiche les comptes de démonstration et leur mot de
passe. Ce mot de passe est public : gardez la démo pour une évaluation, puis supprimez l'application et ses add-ons
et déployez de nouveau pour démarrer vide.

Pour déployer l'outil :

1. Lancez le déploiement. Clever Cloud installe `requirements.txt`, lance les tâches de préparation, puis démarre
   gunicorn. Le journal du déploiement montre le résumé de démarrage : version, base, adresses et e-mails. Ce résumé
   est en anglais, comme tous les messages destinés à l'IT.
2. Ouvrez l'adresse de l'application. Sur une base vide, l'assistant **Mise en place** s'affiche.
3. Faites l'étape 1 de l'assistant, **Compte administrateur**. Pour en savoir plus, voir
   [Installation](/docs/), section 3.

### Vérifier l'installation

Pour vérifier l'installation :

1. Ouvrez `https://<adresse>/sante/`. La page répond `{"etat": "ok", …}`.
2. Allez dans **Administration › Paramètres › Hébergement**. La page indique la version, PostgreSQL et HTTPS.
3. Sur la même page, cliquez sur **Envoyer un e-mail de test**. L'e-mail de test arrive.

## Faire tourner l'outil

Le tableau indique comment faire les opérations courantes chez Clever Cloud :

| Pour | Faire |
|---|---|
| Mettre à jour | Poussez la nouvelle version sur la branche déployée, ou cliquez sur **Redeploy**. La préparation sauvegarde la base avant de la migrer. |
| Sauvegarder | Par défaut, l'outil sauvegarde automatiquement chaque nuit dans `data/backups`, sur le FS Bucket. S'y ajoutent les sauvegardes de l'add-on PostgreSQL. Pour télécharger une sauvegarde, allez dans **Administration › Paramètres › Hébergement**. |
| Restaurer | Depuis l'outil, allez dans **Administration › Paramètres › Hébergement** et cliquez sur **Restaurer…**. Si l'outil ne démarre plus, ouvrez une console SSH (`clever ssh`). Lancez `python manage.py restore <archive>`, puis redémarrez l'application. |
| Revenir à la version précédente | Prévenez les équipes. Déployez la version précédente (poussez le commit précédent sur la branche déployée) : la préparation n'applique aucune migration. Ouvrez ensuite une console SSH (`clever ssh`) et restaurez l'archive « before-update » de chaque espace : `python manage.py restore <archive> --yes --rebuild`, et `SPACE=<code> python manage.py restore <archive de cet espace> --yes --rebuild`. Redémarrez ensuite l'application. Si la version précédente n'a pas `--rebuild` (les plus anciennes versions) : avant de la déployer, défaites les changements de la base faits par la mise à jour dans une console SSH de la version installée, puis restaurez sans `--rebuild`. Les commandes sont dans [Installation](/docs/), « Revenir à une version antérieure avec PostgreSQL ». |
| Utiliser plusieurs espaces | Le registre commun et chaque espace sont des schémas de la même base PostgreSQL (`commun`, `espace_<code>`). Le compte de l'add-on doit pouvoir créer des schémas. Le registre ouvre ses propres connexions (environ deux fois plus qu'avant). Vérifiez la limite de connexions de l'offre. Au plus : processus × fils × (2 + nombre d'espaces supplémentaires) pour le serveur, plus 4 × (2 + nombre d'espaces supplémentaires) pour les tâches de fond ; PostgreSQL en permet 100 par défaut, assez pour 2 espaces supplémentaires avec les réglages par défaut. À partir de 3, ou si l'offre en permet moins : `SPACES_CONN_MAX_AGE=0`, moins de `GUNICORN_THREADS` ou de `GUNICORN_WORKERS`, ou une offre plus grande. Pour en savoir plus (en anglais), voir Spaces, § 2. |
| Superviser | Branchez la surveillance de Clever Cloud (ou un outil externe) sur `/sante/`. |
| Limiter les essais de connexion | Rien à régler. L'outil compte les connexions manquées dans `data/sign-in-attempts`, sur le FS Bucket : tous les processus et toutes les instances de l'application partagent ce compte, qui reste après un redéploiement. |
| Lire le journal | Ouvrez l'onglet **Logs** de la console, ou lancez `clever logs`. |

## Limites connues

Le tableau indique les limites de l'hébergement clé en main et leurs conséquences :

| Limite | Conséquence |
|---|---|
| Les FS Buckets sont faits pour des fichiers, pas pour une base. | La base va dans l'add-on PostgreSQL, jamais en SQLite sur le FS Bucket. |
| Clever Cloud sauvegarde le FS Bucket toutes les 24 heures, avec 72 heures de rétention. | Les sauvegardes de l'outil restent la référence. L'outil garde par défaut les 14 plus récentes (14 jours avec la sauvegarde quotidienne). Téléchargez-les de temps en temps. |
| Une sauvegarde garde les fichiers de preuve qui existaient au moment où elle a été faite. | Un fichier de preuve qu'un administrateur supprime (**Administration › Preuves à supprimer**) reste dans les sauvegardes existantes, dans `data/backups` et dans les sauvegardes du FS Bucket (72 heures), jusqu'à leur remplacement. Une restauration le remet dans la liste. Baissez le nombre de sauvegardes gardées pour les données très sensibles, et supprimez vos copies externes selon un calendrier équivalent. Voir [Installation](/docs/), « Sauvegardes et preuves supprimées ». |
| Scalingo, et tout hébergeur sans dossier persistant, demandent un stockage objet. | Le stockage objet (S3) des preuves est nécessaire (django-storages). Il est prévu après la version 1.0, si le besoin se confirme. |
