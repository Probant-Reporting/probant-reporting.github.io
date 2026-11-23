---
title: "Mettre à jour l'outil"
description: "Quand la base doit changer, le journal affiche cette ligne et le chemin de l'archive avant le résumé : Updating space \"principal\" (3 migration(s)):…"
order: 6
group: "Run"
source: "docs/fr/installation.md"
---

Pour mettre à jour l'outil :

1. Allez dans le dossier de l'outil (`probant`). Par exemple : `cd probant`.
2. Lancez `./update.sh`. Le script affiche la nouvelle version quand la mise à jour est terminée.

Le script effectue ces étapes, dans cet ordre :

1. Il fait une sauvegarde nommée « before-update » de chaque espace, avec la version installée. Si la sauvegarde d'un
   espace échoue, la mise à jour s'arrête et ne change rien.
2. Il récupère la nouvelle version :
   - Avec `git pull`, puis une nouvelle construction de l'image
   - Ou, si `IMAGE` est renseigné dans `.env`, avec `docker compose pull`
3. Il redémarre l'outil. L'outil applique les changements de structure de la base automatiquement au démarrage. Si
   la base doit changer, l'outil fait d'abord une sauvegarde automatique.
4. Il attend que l'outil réponde.

À chaque démarrage, le journal (`docker compose logs web`) affiche un court résumé en anglais. Par exemple :

```text
Probant, version 1.0.0 (3f2a9c1d7e4b)
Database: PostgreSQL (db/probant), 0 migration(s) applied; installation "Probant", 23 account(s)
Data: /data; backups: /data/backups (14 archive(s))
Address(es): reporting.example.com; HTTPS: yes
E-mails: SMTP smtp.example.com:587
```

Quand la base doit changer, le journal affiche cette ligne et le chemin de l'archive avant le résumé :
`Updating space "principal" (3 migration(s)): automatic backup before.` (mise à jour de l'espace principal :
sauvegarde automatique avant).

Le numéro de version est affiché en bas de chaque page et dans **Administration › Paramètres › Hébergement**.

## Revenir à la version précédente

> **Avertissement :** revenir en arrière remplace tout ce qui a été fait depuis la sauvegarde « before-update ».
> Prévenez les équipes, et faites-le quand personne ne saisit.

La mise à jour fait une sauvegarde « before-update » de chaque espace avant de changer quoi que ce soit. Listez les
sauvegardes : `docker compose exec web python manage.py backup --list` (ajoutez `-e SPACE=<code>` pour un autre espace).
Les archives d'un autre espace sont dans `/data/backups/spaces/<code>/`, celle du registre commun dans
`/data/backups/shared/`. La version qui a fait une archive sait toujours la lire : pour revenir en arrière, prenez la
plus ancienne archive « before-update » de la mise à jour.

Les étapes dépendent de la base :

- **SQLite** (par défaut) : faites les étapes ci-dessous, sans `--rebuild`.
- **PostgreSQL** : une sauvegarde PostgreSQL (format JSON) ne se restaure que dans une base qui a exactement ses
  migrations. Après une mise à jour, la base en a davantage. L'option `--rebuild` de `restore` supprime les tables de
  l'espace, les recrée pour la version installée, puis charge la sauvegarde. Elle fait tout cela en une seule étape : si
  une étape échoue, la base ne change pas.

Pour revenir à la version précédente :

1. Arrêtez l'outil : `docker compose stop web`.
2. Récupérez la version précédente, sans la démarrer :
   - Avec `git` : repérez-la (`git log --oneline -5`), puis lancez `git checkout <version-précédente>` et
     `docker compose build web`.
   - Avec une image publiée : mettez l'image précédente dans `IMAGE=` du fichier `.env`, puis lancez
     `docker compose pull web`.
3. Restaurez l'archive « before-update » de l'espace principal :
   `docker compose run --rm web python manage.py restore <archive before-update> --yes --rebuild`
   (SQLite : sans `--rebuild`).
4. Pour chaque autre espace, restaurez sa propre archive :
   `docker compose run --rm -e SPACE=<code> web python manage.py restore <archive de cet espace> --yes --rebuild`.
5. Facultatif : pour retrouver les comptes et les mots de passe d'avant la mise à jour, restaurez le registre commun :
   `docker compose run --rm web python manage.py restore --shared <registry-…-before-update.zip> --yes`.
   Sans cette étape, chacun garde son mot de passe actuel.
6. Démarrez l'outil : `docker compose up -d`.

Si une restauration dit que l'archive n'a pas de signature valide de cette installation (archive faite sur un autre
serveur, par exemple), relancez la même commande avec `--unsigned`.

Chaque restauration sauvegarde d'abord l'état actuel (archive « before-restore »). Gardez ces archives jusqu'à ce que
l'outil fonctionne de nouveau.

Pour mettre l'outil à jour plus tard, revenez d'abord sur la branche principale : `git checkout main`, puis
`./update.sh`. Après `git checkout <version-précédente>`, `git pull` refuse de s'exécuter (« You are not currently on a
branch ») et `update.sh` s'arrête.

### Restaurer une sauvegarde PostgreSQL sur un nouveau serveur

Une sauvegarde PostgreSQL ne se restaure qu'avec la version de l'outil qui l'a faite, ou avec `--rebuild`. Sur un
nouveau serveur, installez l'outil, restaurez le registre commun (`restore --shared`), puis l'espace principal et chaque
autre espace (étapes 3 et 4 ci-dessus). Le nouveau serveur a une autre clé secrète : ajoutez `--unsigned` à la
restauration de chaque espace, ou copiez le fichier `.secret_key` de l'ancien dossier des données dans le nouveau avant
le premier démarrage.
