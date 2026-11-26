---
title: "Mettre à jour l'outil"
description: "Pour installer une version donnée au lieu de la dernière, après une installation en une commande, lancez ./update.sh --version X.Y.Z. Le script refuse une…"
order: 6
group: "Run"
source: "docs/fr/installation.md"
---

Pour mettre à jour l'outil :

1. Allez dans le dossier de l'outil (`probant`). Par exemple : `cd probant`.
2. Lancez `./update.sh`. Le script affiche la nouvelle version quand la mise à jour est terminée.

Pour installer une version donnée au lieu de la dernière, après une installation en une commande, lancez
`./update.sh --version X.Y.Z`. Le script refuse une version plus ancienne que la version installée : pour revenir en
arrière, voir « Revenir à la version précédente ».

Vous pouvez mettre à jour depuis n'importe quelle version publiée, sans installer les versions intermédiaires. Un test automatique l'essaie depuis chaque version publiée.

Le script effectue ces étapes, dans cet ordre :

1. Il fait une sauvegarde nommée « before-update » de chaque espace, avec la version installée. Si la sauvegarde d'un
   espace échoue, la mise à jour s'arrête et ne change rien.
2. Il récupère la nouvelle version :
   - Après une installation en une commande (un dossier sans Git, avec `IMAGE` réglé sur une version de
     `ghcr.io/probant-reporting/probant`) : il télécharge les fichiers de la nouvelle version, comme l'installation,
     puis règle `IMAGE` dans `.env` sur l'image de cette version et la télécharge. Il garde les autres réglages de
     `.env` et les données. Si un téléchargement échoue, la mise à jour s'arrête et ne change rien. Avant de mettre
     les fichiers en place, il contrôle chacun avec la liste des empreintes SHA-256 de la release, et la signature de
     cette liste quand il le peut, comme l'installation (voir « Installer en une commande »). Si la liste manque, si
     sa signature est refusée, ou si un seul fichier ne correspond pas, la mise à jour s'arrête et ne change rien
     (code de sortie 3).
   - Après une installation avec Git : avec `git pull`, puis une nouvelle construction de l'image
   - Ou, si `IMAGE` est renseigné dans `.env` avec une autre image, avec `docker compose pull`
3. Il redémarre l'outil. L'outil applique les changements de structure de la base automatiquement au démarrage. Si
   la base doit changer, l'outil fait d'abord une sauvegarde automatique.
4. Il attend que l'outil réponde.

À chaque démarrage, le journal (`docker compose logs web`) affiche un court résumé en anglais. Par exemple :

```text
Probant, version 1.1.0 (3f2a9c1d7e4b)
Database: PostgreSQL (db/probant), 0 migration(s) applied; installation "Probant", 23 account(s)
Data: /data; backups: /data/backups (14 archive(s))
Address(es): reporting.example.com; HTTPS: yes
E-mails: SMTP smtp.example.com:587
```

Quand la base doit changer, le journal affiche cette ligne et le chemin de l'archive avant le résumé :
`Updating space "principal" (3 migration(s)): automatic backup before.` (mise à jour de l'espace principal :
sauvegarde automatique avant).

Le numéro de version est affiché en bas de chaque page et dans **Administration › Paramètres › Hébergement**.

Une seule mise à jour tourne à la fois : si la mise à jour automatique tourne (voir « Mises à jour automatiques »),
`./update.sh` s'arrête et ne change rien.

## Mises à jour automatiques

Après une installation en une commande, une minuterie du serveur installe chaque nouvelle version la nuit, et revient
à la version précédente si la nouvelle ne fonctionne pas. Le script `auto-update.sh` du dossier de l'outil fait tout le
travail, sur le serveur. L'outil lui-même ne se connecte jamais à Internet, ne compare jamais deux versions et n'a
aucun accès à Docker : aucun socket Docker n'est donné à son conteneur, et aucun autre outil (comme Watchtower) n'est
utilisé.

Le choix se fait dans **Administration › Paramètres › Hébergement**, « Mises à jour automatiques ». Seuls les
gestionnaires des espaces peuvent le changer :

| Choix | Effet |
|---|---|
| L'installer automatiquement | Le serveur installe chaque nouvelle version la nuit. |
| Prévenir seulement | Le serveur vérifie chaque nuit. L'outil montre la nouvelle version, aussi sur la page **Paramètres › Santé** et dans les alertes par e-mail si elles sont allumées. L'IT l'installe avec `./update.sh`. |
| Éteint | Le serveur ne vérifie rien. |
| Attendre après la publication | 0, 1, 3, 7 ou 14 jours (3 par défaut). Le serveur n'installe une version que lorsqu'elle a été publiée depuis ce nombre de jours. Entre-temps, une version qui a un problème peut être corrigée. Avec « Prévenir seulement », l'alerte vient tout de suite. |

Ce tableau montre le réglage au départ :

| Installation | Minuterie du serveur | Choix dans l'outil |
|---|---|---|
| Installation neuve en une commande (`get.sh`) | Posée | L'installer automatiquement, attendre 3 jours |
| Installation existante, mise à jour vers une version qui a les mises à jour automatiques | Pas posée : lancer `./install.sh --auto-update on` | Éteint |
| Installation avec Git, sans accès à Internet (`--offline`), ou avec une autre image | Pas disponible | — |
| Hébergement géré, version tout-en-un | Pas disponible : l'écran le dit | — |

### Ce que fait un passage

1. Il s'arrête tout de suite si une autre mise à jour tourne (le verrou `.update.lock` du dossier, partagé avec
   `./update.sh`), si l'installation n'utilise pas une version publiée, si l'outil est arrêté, ou si le choix est
   « Éteint ».
2. Il trouve la dernière version publiée, comme `./update.sh`, et télécharge son image. Si l'empreinte (digest) de
   cette image est celle de l'image qui tourne, il n'y a rien à faire.
3. Il vérifie la signature de la nouvelle image (voir « Signature de la nouvelle image »). Si la signature manque, si
   elle n'est pas correcte, ou si la vérification est impossible, rien n'est installé.
4. Il s'arrête là avec « Prévenir seulement », pendant l'attente après la publication, pour une image dont la mise à
   jour automatique a déjà échoué, et pour une version qui change le registre commun des comptes (ce changement ne se
   défait pas automatiquement : l'IT installe cette version avec `./update.sh`).
5. Il ne met pas à jour pendant une restauration, une sauvegarde, un gros import ou un gros export de l'outil. Il
   réessaie la nuit suivante.
6. Il télécharge la liste des empreintes SHA-256 des fichiers de cette version, depuis sa release, et vérifie la
   signature de cette liste (voir « Signature de la nouvelle image »). Si la liste manque, ou si sa signature n'est
   pas vérifiée, rien n'est installé. Il lance ensuite `./update.sh` pour cette version, avec cette liste et avec
   l'image épinglée sur l'empreinte vérifiée (`IMAGE=ghcr.io/probant-reporting/probant:X.Y.Z@sha256:…`).
   `./update.sh` fait d'abord la sauvegarde « before-update » de chaque espace, comme toujours, et contrôle chaque
   fichier avec la liste avant d'en mettre un seul en place.
7. Il contrôle `/sante/`, puis de nouveau 30 secondes plus tard.

Si la nouvelle version ne répond pas, le script revient en arrière automatiquement :

1. Il remet les fichiers et le `.env` d'avant (gardés dans `.auto-update/previous/`) et l'image d'avant (elle reste sur
   le serveur).
2. Il compare les migrations de chaque base avec celles d'avant. Si la nouvelle version a changé la base d'un espace,
   il restaure la sauvegarde « before-update » de cet espace faite par `./update.sh`, avec `restore --rebuild` (SQLite
   et PostgreSQL). Un espace qui n'a pas changé n'est pas restauré : rien n'est perdu.
3. Il démarre la version d'avant et contrôle `/sante/`.

L'écran dit alors « Le serveur est revenu à la version X.Y.Z », comme la page **Paramètres › Santé** et les alertes par
e-mail. La même image n'est pas réessayée : quand la cause est connue, l'IT lance `sudo ./auto-update.sh --retry`. Si
le retour arrière ne réussit pas entièrement (une restauration échoue, le registre commun a changé, ou la version
d'avant ne répond pas), le résultat est un échec, l'alerte dit « appelez votre équipe IT », et l'IT suit « Revenir à la
version précédente ». Plus rien n'est fait automatiquement, pas même les nuits suivantes, tant que l'IT n'a pas lancé
`sudo ./auto-update.sh --retry`.

### Signature de la nouvelle image

Le script vérifie la signature avec cosign dans son conteneur officiel, `ghcr.io/sigstore/cosign/cosign`, épinglé par
son empreinte dans `auto-update.sh`. Docker contrôle cette empreinte quand il télécharge le conteneur : rien à installer
à la main. Le conteneur tourne en lecture seule, sans aucun privilège, et sans aucun dossier du serveur sauf les
autorités de certification de votre entreprise (`certificates/ca/`). Le contrôle est celui de « Vérifier l'image »
(section 2) : l'image doit être signée par le workflow `image.yml` du dépôt `Probant-Reporting/probant`, pour
l'étiquette de cette version, avec l'émetteur `https://token.actions.githubusercontent.com`. La signature nomme
l'empreinte de l'image, et le script installe exactement cette empreinte.

Le script vérifie de la même façon la liste des empreintes SHA-256 des fichiers de la version, avec le même conteneur
et la même identité (`cosign verify-blob`). Pour ce contrôle, le conteneur ne lit que le dossier de la liste, en
lecture seule, sous l'utilisateur du script. Ici, une liste qui ne peut pas être vérifiée arrête toujours la mise à
jour.

### Allumer ou éteindre la minuterie

Dans le dossier de l'outil, en root (`sudo`) :

- `./install.sh --auto-update on` pose la minuterie : chaque nuit vers 04:00, heure du serveur, avec un délai au hasard
  d'une heure au plus. Pour choisir l'heure : `./install.sh --auto-update on --auto-update-time 01:30`. Avec systemd,
  la minuterie est `probant-auto-update-<numéro>.timer`. Sans systemd, c'est un fichier de `/etc/cron.d/`. Sans root,
  c'est une ligne de la crontab de l'utilisateur.
- `./install.sh --auto-update off` retire la minuterie. Rien d'autre ne change.

Sur une installation existante, ces commandes ne changent que la minuterie : le choix dans l'outil reste celui des
administrateurs. Avant de supprimer le dossier de l'outil, lancez `./install.sh --auto-update off`. Si le dossier est
déjà supprimé, retirez la minuterie à la main : `sudo systemctl disable --now probant-auto-update-<numéro>.timer`, puis
supprimez les deux fichiers `/etc/systemd/system/probant-auto-update-<numéro>.*` (ou le fichier de `/etc/cron.d/`).

### Lire le journal

- `auto-update.log`, dans le dossier de l'outil : chaque étape de chaque passage, et la sortie de `./update.sh`.
- Avec systemd : `journalctl -u 'probant-auto-update-*'`, et le prochain passage : `systemctl list-timers 'probant-auto-update-*'`.
- `./auto-update.sh --status` : le dernier résultat.
- `sudo ./auto-update.sh` : un passage maintenant, le même que celui de la minuterie.

L'outil montre le dernier résultat dans **Paramètres › Hébergement**, et dit quand la minuterie a tourné pour la
dernière fois. Si elle n'a pas tourné depuis 3 jours, la page **Paramètres › Santé** le dit, comme les alertes par
e-mail si elles sont allumées.

### Réseau du serveur

Le script a besoin du HTTPS sortant (TCP 443) depuis le serveur, pas depuis le conteneur : `github.com` et
`raw.githubusercontent.com` (la dernière version et ses fichiers), `objects.githubusercontent.com` et
`release-assets.githubusercontent.com` (la liste des empreintes des fichiers, jointe à la release),
`ghcr.io` et `pkg-containers.githubusercontent.com` (l'image et le conteneur de cosign), et `tuf-repo-cdn.sigstore.dev` (la racine de confiance de Sigstore, lue par
cosign). Derrière un proxy, réglez `HTTPS_PROXY` dans l'environnement de la minuterie (par exemple
`systemctl edit probant-auto-update-<numéro>.service`), et le proxy de Docker pour le téléchargement des images.

## Mettre à jour sans accès à Internet

Pour mettre à jour une installation sans accès à Internet, utilisez le paquet hors ligne de la nouvelle version :

1. Téléchargez le paquet de la nouvelle version et vérifiez-le, comme aux étapes 1 à 3 de « Installer sans accès à
   Internet » (section 2).
2. Copiez le paquet sur le serveur, et extrayez-le dans un autre dossier que le dossier de l'outil. Par exemple :

   ```bash
   mkdir /tmp/probant-new
   tar -xf probant-X.Y.Z-offline.tar -C /tmp/probant-new
   ```

3. Dans le dossier de l'outil, lancez la mise à jour avec l'archive de la nouvelle image :

   ```bash
   ./update.sh --offline /tmp/probant-new/probant/probant-image-X.Y.Z.tar.gz
   ```

4. Quand l'outil marche, supprimez le dossier de l'étape 2 : `rm -rf /tmp/probant-new`.

Le script vérifie les fichiers du paquet avec son `SHA256SUMS`, et refuse une version plus ancienne que la version
installée : dans les deux cas, il ne change rien. Ensuite, il effectue les étapes de la mise à jour, sans aucun
téléchargement :

1. Il fait la sauvegarde « before-update » de chaque espace, avec la version installée.
2. Il met en place les fichiers du paquet (`docker-compose.yml`, `install.sh`, `update.sh`…). Il garde `.env` et les
   données. Il charge la nouvelle image dans Docker et règle `IMAGE` dans `.env` sur elle.
3. Il redémarre l'outil et attend qu'il réponde.

L'image d'avant reste sur le serveur. Pour revenir en arrière, voir « Revenir à la version précédente ». Une
installation faite en une commande, ou depuis un autre paquet hors ligne, se met à jour de la même façon.

## Revenir à la version précédente

> **Avertissement :** revenir en arrière remplace tout ce qui a été fait depuis la sauvegarde « before-update ».
> Prévenez les équipes, et faites-le quand personne ne saisit.

La mise à jour fait une sauvegarde « before-update » de chaque espace avant de changer quoi que ce soit. Listez les
sauvegardes : `docker compose exec web python manage.py backup --list` (ajoutez `-e SPACE=<code>` pour un autre espace).
Les archives d'un autre espace sont dans `/data/backups/spaces/<code>/`, celle du registre commun dans
`/data/backups/shared/`. La version qui a fait une archive sait toujours la lire : pour revenir en arrière, prenez la
plus ancienne archive « before-update » de la mise à jour. La rotation des sauvegardes garde toujours les archives
« before-update » de la dernière mise à jour : le retour arrière reste possible jusqu'à la mise à jour suivante.

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
   - Avec une image publiée (une installation en une commande, par exemple) : mettez l'image précédente dans
     `IMAGE=` du fichier `.env`, puis lancez `docker compose pull web`. À la fin d'une mise à jour, le script affiche
     l'image d'avant la mise à jour (« Image before the update: … »).
   - Sans accès à Internet : l'image d'avant est encore sur le serveur (`docker image ls`). Mettez-la dans `IMAGE=` du
     fichier `.env`, sans `docker compose pull`.
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

Avec Git, pour mettre l'outil à jour plus tard, revenez d'abord sur la branche principale : `git checkout main`, puis
`./update.sh`. Après `git checkout <version-précédente>`, `git pull` refuse de s'exécuter (« You are not currently on a
branch ») et `update.sh` s'arrête. Après une installation en une commande, lancez `./update.sh` : il réinstalle la
dernière version.

### Restaurer une sauvegarde PostgreSQL sur un nouveau serveur

Une sauvegarde PostgreSQL ne se restaure qu'avec la version de l'outil qui l'a faite, ou avec `--rebuild`. Sur un
nouveau serveur, installez l'outil, restaurez le registre commun (`restore --shared`), puis l'espace principal et chaque
autre espace (étapes 3 et 4 ci-dessus). Le nouveau serveur a une autre clé secrète : ajoutez `--unsigned` à la
restauration de chaque espace, ou copiez le fichier `.secret_key` de l'ancien dossier des données dans le nouveau avant
le premier démarrage.
