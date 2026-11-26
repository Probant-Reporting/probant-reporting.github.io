---
title: "Sauvegarder et restaurer"
description: "Ne déplacez rien dans ce dossier à la main. Pour le détail, voir rangement_des_fichiers.md."
order: 5
group: "Run"
source: "docs/fr/installation.md"
---

## Ce que contient le volume `/data`

L'outil range lui-même ce dossier et y écrit un fichier `README.txt` :

- Bases et clé : à la racine
- Documents ajoutés à l'outil : dans `files/` (`evidence/<période>/<organisation>/<KPI>/`, `settings/logo/`,
  `pending-imports/`)
- Archives : dans `backups/`
- Autres espaces : dans `spaces-data/<code>/`

Ne déplacez rien dans ce dossier à la main. Pour le détail, voir rangement_des_fichiers.md.

Seul l'utilisateur de l'outil peut lire ce que contient ce dossier : l'outil crée les fichiers avec les droits `0600` et
les dossiers avec les droits `0700`, aussi quand vous lancez une commande avec `docker compose exec`. À chaque
démarrage, il retire les droits du groupe et des autres aux fichiers qu'une version plus ancienne a faits.

## Ce que contient une sauvegarde

Une sauvegarde est une archive `.zip` datée, dans `/data/backups`. Elle contient :

- La base complète : comptes, référentiels, campagnes, valeurs, historique, et l'historique des connexions des derniers
  jours (Administration › Paramètres › Hébergement en règle le nombre)
- Les fichiers ajoutés à l'outil : preuves et logo
- Un descriptif : la version de l'outil et le nombre de lignes par table

L'archive contient des données confidentielles. Gardez-la en lieu sûr.

L'archive d'un espace ne contient aucun mot de passe, pas même leurs empreintes. Un administrateur de l'espace peut la
télécharger : l'outil en retire donc les empreintes. Les mots de passe restent dans le registre commun des comptes, qui
a ses propres sauvegardes dans `/data/backups/shared/`. Seule l'IT y a accès : l'outil ne les liste jamais et ne permet
à personne de les télécharger. Elles contiennent les empreintes des mots de passe. Gardez-les en lieu sûr et copiez-les
avec les autres sauvegardes.

> **Remarque :** les archives faites par une version antérieure de l'outil peuvent encore contenir les empreintes
> des mots de passe. Cela comprend les archives que des administrateurs ont téléchargées et les copies que l'IT a faites
> hors du serveur. Supprimez-les quand vous n'en avez plus besoin, ou gardez-les dans un endroit que seule l'IT peut
> ouvrir.

## Sauvegarder l'outil

Ce tableau présente comment sauvegarder l'outil :

| Pour… | Faire |
|---|---|
| Sauvegarder automatiquement | Rien. Par défaut, l'outil fait une sauvegarde chaque jour à 02:30 et garde 14 archives. L'équipe responsable règle la fréquence dans **Administration › Paramètres › Hébergement**. **Copiez les sauvegardes hors du serveur** : dans l'outil, ou par vos propres moyens (voir [Copier les sauvegardes hors du serveur](/docs/back-up-and-restore/#copier-les-sauvegardes-hors-du-serveur)). |
| Sauvegarder maintenant | Lancez `docker compose exec web python manage.py backup`. Un administrateur peut aussi cliquer sur **Créer et télécharger une sauvegarde** dans **Administration › Paramètres › Hébergement**. |
| Lister les sauvegardes | Lancez `docker compose exec web python manage.py backup --list`. |
| Copier les sauvegardes hors du serveur | Dans l'outil : voir [Copier les sauvegardes hors du serveur](/docs/back-up-and-restore/#copier-les-sauvegardes-hors-du-serveur). Par vos propres moyens : lancez `docker compose cp web:/data/backups/. ../probant-backups/`. Cette commande copie les archives, sous-dossiers compris, dans le dossier `probant-backups` à côté du dossier de l'outil. Ne les copiez pas dans le dossier de l'outil : la mise à jour construit l'image à partir de ce dossier. Copiez ensuite `probant-backups` hors du serveur avec votre outil de sauvegarde habituel (rsync, Veeam…), de façon planifiée. Les fichiers copiés gardent leurs droits : seul le compte qui a lancé `docker compose cp` peut les lire (fichiers `0600`, dossiers `0700`). Si votre outil de sauvegarde tourne sous un autre compte, donnez à ce compte l'accès à `probant-backups`, par exemple avec `chown -R`. Ne changez pas les droits dans le volume. |

**Sans Docker**, planifiez la même sauvegarde avec cron : `30 2 * * * cd /opt/reporting && python manage.py backup`.

## Copier les sauvegardes hors du serveur

Les sauvegardes restent dans le volume `/data`, sur le même serveur que l'outil. Si le serveur est perdu, elles le
sont aussi. Copiez-les hors du serveur d'une de ces deux façons.

### Dans l'outil

L'outil peut copier lui-même chaque sauvegarde vers un stockage que l'IT fournit. Un gestionnaire des espaces le
règle dans **Administration › Paramètres › Hébergement**, encart **Copie hors du serveur**, avec **Régler une copie hors du serveur** :

- **Stockage objet compatible S3** : un compartiment chez un hébergeur, ou MinIO sur votre réseau. Indiquez l'adresse du
  service (`https://…` ; `http://` n'est accepté que pour une adresse du réseau interne), la région, le compartiment,
  un dossier facultatif dans le compartiment, l'identifiant de la clé d'accès et la clé secrète. Le style d'adresse est
  automatique ; choisissez « chemin » ou « hôte virtuel » seulement si l'hébergeur le demande.
- **Serveur SFTP** : un serveur ou un NAS. Indiquez le serveur, le port, le nom du compte, un mot de passe ou une clé
  privée (format OpenSSH ou PEM, sans phrase secrète, créée pour cette copie seulement), et le dossier.

Cliquez ensuite sur **Essayer la destination**. L'outil dépose un petit fichier d'essai, le relit, puis le supprime.
Avec SFTP, le premier essai montre l'empreinte SHA-256 de la clé du serveur. Comparez-la à l'empreinte que donne le
serveur (sur le serveur : `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`), puis cliquez sur **Confirmer cette
clé**. Ensuite, l'outil refuse toute autre clé, avant d'envoyer le mot de passe ou la clé : si le serveur change de
clé, la copie s'arrête et part en alerte, jusqu'à ce qu'un administrateur confirme la nouvelle clé.

Ce que fait ensuite l'outil :

- Il copie chaque nouvelle archive de chaque espace **et** chaque archive du registre commun des comptes
  (`backups/shared/`), dans la minute qui suit la sauvegarde. C'est la tâche de fond des sauvegardes qui le fait
  (`backup --schedule`), jamais une page de l'outil. Pour copier tout de suite :
  `docker compose exec web python manage.py backup --copy`.
- À la destination, il garde le rangement du dossier `backups`, dans un dossier au nom de l'identifiant de
  l'installation : `<dossier ou préfixe>/<identifiant>/backup-….zip` (espace principal), `…/spaces/<code>/backup-….zip`
  (autres espaces), `…/shared/registry-….zip` (registre).
- Si une copie échoue (réseau, droits, stockage plein…), il réessaie plus tard (après 5 minutes, puis 15 minutes,
  jusqu'à 6 heures) et copie tout ce qui attend. **Paramètres › Santé** et `/sante/` (`external_copy`) montrent la
  dernière copie et les archives qui attendent ; une alerte par e-mail part si les alertes sont allumées (section 9).
- Par défaut, il **ne supprime rien** à la destination. Si l'administrateur règle **Copies gardées par espace**,
  l'outil garde ce nombre de copies les plus récentes de chaque espace et du registre, et ne supprime que les archives
  plus anciennes qu'il a faites lui-même (dossier et nom qu'il reconnaît). Il ne supprime jamais un autre fichier, ni la
  dernière archive faite. Pour protéger les copies de toute suppression, donnez au compte le droit d'écrire mais pas
  celui de supprimer, et gardez `0`.
- S3 : le service vérifie l'empreinte SHA-256 de chaque morceau que l'outil envoie ; après l'envoi, l'outil relit la
  taille et l'empreinte. Une grosse archive part en morceaux de 16 Mo. SFTP : l'outil écrit un fichier caché `.part`,
  le renomme, puis vérifie la taille.

> **Attention :** Les copies contiennent toutes les données de l'outil, les empreintes des mots de passe (sauvegardes
> du registre) et les secrets enregistrés dans l'outil, chiffrés avec la clé secrète de l'installation. Choisissez une
> destination privée que seule l'IT peut ouvrir. L'outil ne chiffre pas les archives.

L'outil enregistre la clé secrète S3, et le mot de passe ou la clé privée SFTP, chiffrés avec la clé secrète de
l'installation. Il ne les réaffiche jamais. Après une restauration sur un autre serveur, un administrateur les saisit
de nouveau. Pour les garder, laissez les champs vides quand vous enregistrez. Si vous changez la destination (S3 :
adresse, région, compartiment ou identifiant de la clé d'accès ; SFTP : serveur, port ou compte), l'outil redemande le
secret, pour qu'il ne parte jamais vers une autre destination. En SFTP, un autre serveur ou un autre port oublie aussi
la clé du serveur confirmée.

La connexion utilise les autorités de certification du système et celles que l'IT ajoute (`certificates/ca/`, voir
[Faire confiance à l'autorité de certification de votre entreprise](/docs/install-the-tool/#faire-confiance-à-lautorité-de-certification-de-votre-entreprise)).
Avec `HTTPS_PROXY`, un service S3 public est joint par le proxy ; une adresse du réseau interne est jointe directement.
SFTP demande une connexion directe. L'outil ne se connecte jamais au serveur lui-même, à une adresse locale au lien
(métadonnées de l'hébergeur) ni à une adresse réservée.

La version tout-en-un (Windows ou Mac) n'a pas cette fonction : copiez vous-même le dossier des sauvegardes.

### Par vos propres moyens

Copiez le dossier `/data/backups`, avec tous ses sous-dossiers, avec votre outil de sauvegarde habituel, de façon
planifiée : voir la ligne **Copier les sauvegardes hors du serveur** du tableau ci-dessus. Les deux façons peuvent
fonctionner ensemble.

## Reconstruire un serveur à partir de la copie externe

Si le serveur est perdu, l'IT reconstruit l'installation sur un nouveau serveur à partir de la seule copie :

1. Installez l'outil sur le nouveau serveur (section 2), dans la même version ou une version plus récente. Ne créez
   pas de compte.
2. Récupérez à la destination le dossier au nom de l'identifiant de l'installation (outil S3 ou SFTP de votre choix),
   et copiez son contenu, sous-dossiers compris, dans le dossier des sauvegardes du nouveau serveur :
   `docker compose cp ./<identifiant>/. web:/data/backups/`.
3. Restaurez la sauvegarde la plus récente du registre commun, puis la plus récente de l'espace principal, puis la plus
   récente de chaque autre espace :

   ```bash
   docker compose exec web python manage.py restore --shared registry-AAAAMMJJ-HHMMSS-auto.zip --yes
   docker compose exec web python manage.py restore --unsigned backup-AAAAMMJJ-HHMMSS-auto.zip --yes
   docker compose exec -e SPACE=<code> web python manage.py restore --unsigned backup-AAAAMMJJ-HHMMSS-auto.zip --yes
   docker compose restart web
   ```

   Les archives ont été signées par l'ancien serveur : `--unsigned` est nécessaire, sauf si vous remettez l'ancienne
   clé secrète (`/data/.secret_key` ou `DJANGO_SECRET_KEY`).
4. Chacun se connecte avec son mot de passe habituel. Un administrateur saisit de nouveau les secrets : le mot de passe
   du serveur d'e-mails et le secret de la copie externe. Ils ne se lisent qu'avec la clé secrète de l'ancien serveur.
   Si vous avez gardé cette clé en lieu sûr et l'avez remise avant l'étape 3, ils fonctionnent tout de suite.

## Sauvegardes et preuves supprimées

Un administrateur peut supprimer les fichiers de preuve des KPI sensibles dans **Administration › Preuves à supprimer**. L'outil supprime le fichier aussitôt. Une sauvegarde garde les fichiers de preuve qui existaient au moment où elle a été faite. Les sauvegardes déjà faites gardent donc le fichier jusqu'à ce que l'outil les remplace.

- Le nombre de sauvegardes gardées fixe la durée pendant laquelle un fichier supprimé reste. Avec les valeurs par défaut (une sauvegarde par jour, 14 gardées), il reste jusqu'à 14 jours. Si les données sont très sensibles, baissez ce nombre dans **Administration › Paramètres › Hébergement**.
- Une restauration remet le fichier supprimé, et il réapparaît dans **Preuves à supprimer**. Après une restauration, l'administrateur le supprime de nouveau.
- Les copies que vous faites hors du serveur gardent aussi le fichier. Supprimez les anciennes copies selon un calendrier qui respecte la durée pendant laquelle vous pouvez garder des données sensibles, et dites aux administrateurs combien de temps les copies durent.

## Restaurer une sauvegarde

Une restauration effectue ces étapes :

1. Elle demande une confirmation.
2. Elle sauvegarde d'abord l'état actuel (archive « before-restore »).
3. Elle remplace la base et les fichiers ajoutés à l'outil.

> **Avertissement :** une restauration remplace tout ce qui a été fait depuis la date de la sauvegarde. Les autres
> personnes connectées peuvent être déconnectées. Prévenez les équipes, et ne restaurez pas pendant une période de
> saisie.

Pour restaurer une sauvegarde depuis l'outil :

1. Allez dans **Administration › Paramètres › Hébergement**.
2. À côté de la sauvegarde dans la liste, cliquez sur **Restaurer…**. La page de confirmation s'ouvre.

   Pour utiliser un fichier `.zip` téléchargé auparavant, ouvrez **Restaurer depuis un fichier .zip téléchargé
   auparavant**. Choisissez le fichier, puis cliquez sur **Vérifier le fichier**. L'outil ajoute le fichier à la
   liste.
3. Cochez la case, puis saisissez `RESTAURER`.
4. Cliquez sur **Restaurer cette sauvegarde**. L'outil sauvegarde d'abord l'état actuel. Ensuite, la page de
   connexion affiche « Restauration réussie. L'outil est revenu à l'état du … ».
5. Connectez-vous avec un compte administrateur de la base restaurée.

L'outil ne restaure que les sauvegardes qu'il a faites lui-même, intactes. Quand il fait une sauvegarde, il signe
l'archive avec une clé tirée de la clé secrète de l'installation (`/data/.secret_key` ou `DJANGO_SECRET_KEY`). La page
refuse une archive sans signature valide, aussi quand vous ajoutez un fichier `.zip` : « Cette sauvegarde n'a pas été
faite par cette installation, ou elle a été modifiée après sa création ». Ces archives n'ont pas de signature valide :

- Les archives faites par une version antérieure de l'outil (avant l'existence de la signature)
- Les archives faites par un autre serveur, ou avant un changement de `DJANGO_SECRET_KEY`
- Les archives que quelqu'un a modifiées après la sauvegarde

L'IT peut toujours restaurer une telle archive en ligne de commande, si elle lui fait confiance : ajoutez `--unsigned`
à la commande `restore`. Sans cette option, la commande refuse l'archive et ne change rien.

Pour restaurer une archive du serveur (si l'outil ne démarre plus) :

1. Lancez `docker compose exec web python manage.py restore backup-20261026-023000-auto.zip`. Pour une archive sans
   signature valide, ajoutez `--unsigned`.
2. Lancez `docker compose restart web`.

Pour restaurer une archive que vous avez téléchargée :

1. Copiez l'archive dans le dossier des sauvegardes : `docker compose cp archive.zip web:/data/backups/`.
2. Faites les 2 étapes de la procédure précédente.

Après une restauration, chacun se connecte avec le mot de passe que le registre commun des comptes a pour lui : son
mot de passe actuel. L'archive d'un espace ne contient aucun mot de passe. Si le registre ne connaît pas un compte, ce
compte n'a plus de mot de passe après la restauration. Cela arrive quand vous restaurez une archive sur un autre
serveur, ou quand un compte a été supprimé après la sauvegarde. La restauration le dit (« … account(s) of this space
have no password on this server »). Faites alors l'une de ces actions :

- Restaurez la sauvegarde du registre commun faite au même moment, depuis `/data/backups/shared/` :
  `docker compose exec web python manage.py restore --shared <registry-….zip> --yes`. Sur un nouveau serveur, copiez
  d'abord tout le dossier `backups`, sous-dossiers compris.
- Donnez de nouveaux mots de passe : `docker compose exec web python manage.py changepassword <identifiant>` pour un
  administrateur. Cet administrateur donne ensuite aux autres comptes un mot de passe provisoire dans
  **Administration › Comptes**.

Avec SQLite, vous pouvez restaurer une archive faite avec une version plus ancienne de l'outil dans une version plus
récente. L'outil met la base à jour automatiquement. L'outil refuse l'inverse. Avec PostgreSQL, une archive ne se
restaure qu'avec la version de l'outil qui l'a faite : voyez [Revenir à la version précédente](/docs/update-the-tool/#revenir-à-la-version-précédente)
et [Restaurer une sauvegarde PostgreSQL sur un nouveau serveur](/docs/update-the-tool/#restaurer-une-sauvegarde-postgresql-sur-un-nouveau-serveur).

Pour restaurer, après une mise à jour, une archive PostgreSQL faite par une version plus ancienne :

1. Essayez la restauration. La version plus récente refuse l'archive et le dit. Rien ne change.
2. Revenez à la version qui a fait l'archive (la restauration affiche sa version, aussi dans `backup.json`), et
   restaurez l'archive avec cette version : voyez [Revenir à la version précédente](/docs/update-the-tool/#revenir-à-la-version-précédente).
3. Mettez de nouveau l'outil à jour avec `./update.sh`. La mise à jour amène les données restaurées à la nouvelle version.

## Si une restauration est interrompue

Si une restauration est interrompue (serveur arrêté, conteneur arrêté, disque plein), rien n'est perdu :

- L'outil extrait d'abord les fichiers de l'archive à part. Si le disque est plein, la restauration s'arrête avant
  tout changement.
- Ensuite, l'outil remplace la base d'un coup et échange les fichiers.
- Si la restauration s'arrête après ce point, l'outil la **termine automatiquement au démarrage suivant**. Le
  journal affiche « the restore of …, interrupted, has been finished » (la restauration interrompue est terminée).
  D'ici là, `/sante/` répond `503` (« interrupted restore »).

> **Avertissement :** ne copiez jamais `db.sqlite3` à la main. Un ancien fichier `db.sqlite3-wal` resté à côté peut
> l'abîmer, sans message d'erreur. Passez toujours par `restore`.

## Sauvegarder et restaurer plusieurs espaces

Une installation peut compter plusieurs espaces (départements). Chaque espace a ses propres sauvegardes, dans
`/data/backups/spaces/<code>/`. Le registre commun des comptes a les siennes, dans `/data/backups/shared/`.
**Copiez tout `/data/backups`, sous-dossiers compris.**

Pour lancer une commande pour un seul espace, ajoutez `SPACE=<code>`. Par exemple :
`docker compose exec -e SPACE=achats web python manage.py backup`. Pour le détail (en anglais), voir
docs/spaces.md, § 2.
