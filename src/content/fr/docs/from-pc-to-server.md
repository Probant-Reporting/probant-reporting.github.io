---
title: "De la version tout-en-un à un serveur"
description: "Vous avez essayé Probant avec la version tout-en-un sur un ordinateur, et vous y avez saisi de vraies données. Cette page explique comment passer ces…"
order: 3.5
group: "Get started"
source: "docs/fr/du_pc_au_serveur.md"
ids: {"Avant de commencer":"from-pc-to-server-avant-de-commencer"}
---

Vous avez essayé Probant avec la version tout-en-un sur un ordinateur, et vous y avez saisi de vraies données. Cette
page explique comment passer ces données sur un serveur sans rien perdre. La partie 1 est pour la personne qui utilise
l'outil sur l'ordinateur. La partie 2 est pour l'équipe informatique qui installe le serveur. Sans équipe informatique, donnez la partie 2 à la
personne ou au prestataire qui installe le serveur.

La méthode est simple : vous envoyez tout le dossier `data` de la version tout-en-un. Le serveur s'en sert comme
dossier des données.

## Ce qui passe sur le serveur

| Élément | Passe | Commentaire |
|---|---|---|
| Comptes et mots de passe | Oui | Chacun se connecte avec le même mot de passe. |
| Valeurs, référentiels, campagnes, historique, réglages | Oui | Sauf le mot de passe du serveur d'e-mails, s'il est enregistré dans l'outil : saisissez-le de nouveau sur le serveur. |
| Preuves et logo | Oui | |
| Autres espaces | Oui | |
| Jetons des assistants (MCP) | Oui | |
| Sessions de connexion | Non | Chacun se reconnecte une fois. |
| Clé secrète | Non | La version tout-en-un garde sa propre clé dans `data/.secret_key_all_in_one`. Le serveur ne s'en sert jamais : il crée la sienne à son premier démarrage. L'étape 4 de la partie 2 efface la copie de la clé de l'ordinateur. |
| Sauvegardes faites sur l'ordinateur | Oui, comme fichiers | Le serveur les liste, mais **Restaurer…** les refuse : une autre installation les a signées. L'équipe informatique peut quand même en restaurer une, voir [Restaurer une sauvegarde](/docs/back-up-and-restore/#restaurer-une-sauvegarde). |

## Avant de commencer

- **Démo** : si vous avez choisi la démo au premier démarrage, ne déplacez pas le dossier. Les comptes de la démo ont
  un mot de passe public. Installez le serveur vide et saisissez vos données sur le serveur. Si un dossier de démo
  arrive sur un serveur, le résumé de démarrage du serveur affiche une ligne qui commence par
  `WARNING: this is the demo database`, et **Paramètres › Santé** affiche **Données de démonstration** à regarder
  tant qu'un compte de démo a le mot de passe public.
- **Version** : le serveur doit avoir la même version de l'outil que l'ordinateur, ou une version plus récente. La
  version s'affiche en bas de chaque page.

## Partie 1 : sur l'ordinateur

1. Demandez aux personnes qui saisissent d'arrêter. Ce que l'on saisit sur l'ordinateur après l'étape 3 n'est pas sur
   le serveur.
2. Facultatif : faites une copie de sécurité. Allez dans **Administration › Paramètres › Hébergement**, puis cliquez
   sur **Créer et télécharger une sauvegarde**. Gardez le fichier.
3. Fermez la fenêtre de l'outil. Cela arrête l'outil. Ne copiez pas le dossier pendant que l'outil tourne.
4. Faites un fichier `.zip` du dossier `data`, qui est à côté de `Start.bat` ou de `Start.command` :
   - Windows : clic droit sur `data`, puis **Envoyer vers › Dossier compressé**.
   - Mac : Contrôle-clic sur `data`, puis **Compresser « data »**.
5. Remettez le fichier `.zip` à l'équipe informatique de façon sûre, par exemple sur une clé USB ou par un transfert
   de fichiers sécurisé. Ne l'envoyez pas par un e-mail ordinaire : il contient toutes vos données et la forme protégée
   des mots de passe.
6. Gardez la version tout-en-un jusqu'à ce que le serveur fonctionne. Ensuite, vous pouvez la supprimer.

## Partie 2 : sur le serveur (équipe informatique)

### Docker avec SQLite (par défaut)

Faites ces étapes avant le premier démarrage de l'outil, tant que son volume de données est vide.

1. Installez l'outil, mais ne le démarrez pas : faites les étapes 1 et 2 de
   [Installer sans le script](/docs/install-the-tool/#installer-sans-le-script), puis lancez `docker compose build web`.
2. Extrayez le fichier `.zip` à côté du dossier de l'outil, par exemple dans `../pc-data`. Ne l'extrayez pas dans le
   dossier de l'outil. Le dossier doit contenir `db.sqlite3` et `shared.sqlite3`.
3. Vérifiez que ce n'est pas la démo : `cat ../pc-data/.package-ready` affiche `empty`. S'il affiche `demo`,
   arrêtez-vous et lisez [Avant de commencer](#from-pc-to-server-avant-de-commencer).
4. Copiez le dossier dans le volume de données :

   ```bash
   docker compose run --rm --no-deps -v "$(pwd)/../pc-data:/import:ro" web sh -c "cp -R /import/. /data/ && rm -f /data/.secret_key_all_in_one"
   ```

   Les fichiers copiés appartiennent à l'utilisateur de l'outil, et seul cet utilisateur peut les lire. La commande
   efface la clé secrète de l'ordinateur : le serveur crée la sienne.
5. Démarrez l'outil : `docker compose up -d`. Lisez le résumé de démarrage : `docker compose logs web`. Il affiche le
   nom de l'installation, le nombre de comptes et « New secret key created ». Il n'affiche pas de ligne `WARNING`.
6. Vérifiez le déménagement :
   - `http://ADRESSE-DU-SERVEUR:8000/sante/` répond `{"etat": "ok"}`.
   - Une personne se connecte avec le même e-mail et le même mot de passe que sur l'ordinateur.
   - Une valeur et sa preuve s'ouvrent.
7. Supprimez le fichier `.zip` et le dossier `../pc-data` : ils contiennent la forme protégée des mots de passe.

Si l'outil a déjà démarré sur ce serveur et que personne ne s'en est encore servi, videz d'abord le volume : lancez
`docker compose down`, puis `docker volume rm probant_donnees`. Faites ensuite les étapes 4 à 7. Ne copiez jamais le
dossier par-dessus un volume de données en service : un ancien fichier `db.sqlite3-wal` à côté de la nouvelle base
peut l'abîmer.

**Sans Docker** : arrêtez l'outil, mettez le contenu du dossier dans le dossier des données (`DATA_DIR`) avant le
premier démarrage, puis lancez `python manage.py startup` et démarrez l'outil.

### PostgreSQL

La version tout-en-un utilise SQLite. Faites le déménagement en deux temps :

1. Faites les étapes de [Docker avec SQLite](#docker-avec-sqlite-par-défaut), avec `DATABASE_URL` vide dans `.env`.
   Vérifiez que l'outil fonctionne.
2. Suivez [Passer d'une installation SQLite existante à PostgreSQL](/docs/use-postgresql/#passer-dune-installation-sqlite-existante-à-postgresql).
   L'archive du registre commun emporte les mots de passe.

**L'hébergement clé en main** ([Clever Cloud](/docs/managed-hosting/)) n'a pas de SQLite. Faites le premier temps
sur n'importe quel ordinateur équipé de Docker. Sur cet ordinateur, faites les deux archives des étapes 1 et 2 du
passage à PostgreSQL. Copiez-les dans `data/backups/` et `data/backups/shared/` sur le FS Bucket. Puis, dans une
console SSH (`clever ssh`), avant que quiconque utilise l'assistant de mise en place :

```bash
python manage.py restore --shared <archive du registre> --yes
python manage.py restore <archive de l'espace principal> --unsigned --yes
```

Redémarrez ensuite l'application. L'option `--unsigned` est nécessaire parce qu'un autre ordinateur a fait l'archive.
Les deux ordinateurs doivent avoir la même version de l'outil.

### Si vous n'avez qu'un fichier de sauvegarde

Si la personne ne peut pas envoyer le dossier `data`, la sauvegarde de l'étape 2 de la partie 1 déplace aussi les
données, avec ces limites : les mots de passe ne passent pas, et seul l'espace de la sauvegarde passe. Restaurez-la sur
un serveur avec SQLite, avant que quiconque utilise l'assistant de mise en place :

1. Copiez l'archive dans le volume : `docker compose cp <archive>.zip web:/data/backups/`.
2. Lancez `docker compose exec web python manage.py restore <archive>.zip --unsigned --other-space --yes`, puis
   `docker compose restart web`.
3. Donnez un mot de passe à un administrateur : `docker compose exec web python manage.py changepassword <identifiant>`.
   Cet administrateur donne aux autres comptes un mot de passe provisoire dans **Administration › Comptes**.

## Messages que vous pouvez voir

| Message | Que faire |
|---|---|
| « Cette sauvegarde n'a pas été faite par cette installation, ou elle a été modifiée après sa création » (page **Hébergement**) | Normal pour une sauvegarde faite sur l'ordinateur. Utilisez le dossier `data`, ou restaurez la sauvegarde en ligne de commande avec `--unsigned`. |
| « This backup comes from another installation of the tool » (`restore`) | Normal pour une sauvegarde faite sur l'ordinateur. Ajoutez `--other-space` (section [Si vous n'avez qu'un fichier de sauvegarde](#si-vous-navez-quun-fichier-de-sauvegarde)). |
| « … account(s) of this space have no password on this server » | La sauvegarde n'emporte pas les mots de passe. Faites l'étape 3 de [Si vous n'avez qu'un fichier de sauvegarde](#si-vous-navez-quun-fichier-de-sauvegarde). |
| `WARNING: this is the demo database` (résumé de démarrage) | Le dossier vient de la démo. Installez le serveur vide : voir [Avant de commencer](#from-pc-to-server-avant-de-commencer). |
