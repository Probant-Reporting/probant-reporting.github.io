---
title: "Installer l'outil"
description: "Les deux façons donnent le même outil, avec les mêmes réglages et les mêmes sauvegardes. Seule l'installation en une commande pose les mises à jour…"
order: 2
group: "Get started"
source: "docs/fr/installation.md"
---

Vous pouvez installer l'outil de deux façons. Ce tableau les compare :

| Façon | Ce qu'il faut sur le serveur, en plus de Docker | Durée |
|---|---|---|
| En une commande (conseillé) | `curl` | 2 minutes environ : le serveur télécharge l'image publiée |
| Avec Git | Git | 3 à 5 minutes : le serveur construit l'image |

Les deux façons donnent le même outil, avec les mêmes réglages et les mêmes sauvegardes. Seule l'installation en une
commande pose les mises à jour automatiques (section 6). Pour un serveur sans accès à Internet, voir « Installer sans
accès à Internet ».

## Vérifier le serveur avant d'installer

Vous n'avez pas à lancer ce contrôle vous-même : l'installeur le lance au début d'une installation neuve. Lancez-le
avant si vous voulez savoir ce qui manque sans rien installer. Le contrôle lit le serveur et ne change rien. C'est le
script `check.sh`, dans les fichiers de chaque version.

Pour vérifier le serveur avant une installation en une commande, lancez la commande de l'installation avec
`--check` :

```bash
curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --check
```

Ajoutez les options de l'installation, par exemple `--domain reporting.example.com` ou `--port 8080`. La commande
télécharge le contrôle de la version dans un dossier temporaire, le lance, puis supprime le dossier. Dans un dossier
qui contient les fichiers de l'outil (une installation avec Git, par exemple), lancez `./install.sh --check`, avec les
mêmes options.

Ce tableau présente ce que vérifie le contrôle :

| Contrôle | Ce qu'il vérifie |
|---|---|
| Système et architecture | Linux, 64 bits. L'image publiée est pour `x86_64` : sur `arm64`, installez avec Git. |
| Docker et Compose | Docker Engine 24 ou plus récent, extension Compose v2.24 ou plus récente (section 1). |
| Service Docker | Docker répond, et le compte a le droit de l'utiliser (`sudo`, ou le groupe `docker`). |
| Mémoire, processeurs, disque | Au moins 1 Go de mémoire, 1 processeur, et 5 Go libres dans le dossier de Docker. |
| Ports | Le port HTTP est libre (8000, ou `--port`). Avec `--domain` : aussi les ports 80 et 443. |
| Nom de domaine | Avec `--domain` : le nom pointe vers une adresse du serveur. |
| Réseau | Le registre de l'image et GitHub (fichiers de la version) répondent en HTTPS, par `HTTPS_PROXY` s'il est réglé. Avec un proxy, il vérifie aussi que le service Docker peut télécharger l'image. |
| Horloge | L'heure du serveur est juste : 5 minutes au plus d'écart avec l'heure de GitHub. |

Le contrôle affiche une ligne par contrôle :

- `OK` : rien à faire.
- `To fix` (à corriger) : la ligne dit quoi faire, en une phrase.
- `Not checked` (non vérifié) : la ligne dit pourquoi. Par exemple, un serveur derrière un routeur (NAT) ne connaît pas
  son adresse publique. Le contrôle ne peut pas savoir si le nom de domaine pointe vers lui. Vérifiez vous-même
  l'enregistrement DNS et le routeur.

À la fin, le contrôle affiche `Ready` (prêt), ou `Here is what is missing` (ce qui manque) avec la liste des points à
corriger. Il se termine avec le code de sortie 0 (prêt) ou 1 (il manque quelque chose).

Au début d'une installation neuve (un dossier sans `.env`), si un point est à corriger, l'installeur s'arrête et
n'installe rien. Un Docker absent ne l'arrête pas : l'installeur propose ensuite d'installer Docker. Pour installer
sans le contrôle, ajoutez `--skip-check`. N'utilisez cette option que si vous savez
pourquoi le contrôle échoue. Par exemple, derrière un proxy que le contrôle ne sait pas utiliser.

Si le réseau passe par un proxy, réglez-le avant le contrôle : `sudo HTTPS_PROXY=http://proxy.example.com:3128 sh …`.
Avec `sudo`, les variables de votre session ne passent pas au script. Docker télécharge l'image lui-même : réglez aussi
le proxy du service Docker (https://docs.docker.com/engine/daemon/proxy/).

## Installer en une commande

La commande utilise l'image publiée de l'outil, `ghcr.io/probant-reporting/probant`. Le serveur ne construit rien, et
il n'a pas besoin de Git.

Pour installer l'outil :

1. Connectez-vous au serveur avec un compte qui peut utiliser `sudo`.
2. Allez dans le dossier qui contiendra le dossier de l'outil (par exemple `cd /opt`).
3. Lancez la commande :

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh
   ```

   Pour le HTTPS avec un nom de domaine, ajoutez les options après `sh -s --` :

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --domain reporting.example.com
   ```

   La commande affiche l'adresse à ouvrir et le dossier de l'installation.
4. Allez dans le dossier de l'outil : `cd probant`. Lancez les autres commandes de ce guide dans ce dossier.

> **Remarque :** les mises à jour automatiques sont allumées après cette installation : le serveur installe chaque
> nouvelle version la nuit, 3 jours après sa publication. Pour installer sans elles, ajoutez `--auto-update off`.
> Voir « Mises à jour automatiques » (section 6).

La commande effectue ces étapes, dans cet ordre :

1. Elle trouve la dernière version publiée de l'outil.
2. Elle crée le dossier `probant`. Si ce dossier contient déjà une installation, la commande s'arrête et ne change
   rien.
3. Elle télécharge dans ce dossier les seuls fichiers qui font tourner l'outil : `docker-compose.yml`, `.env.example`,
   `install.sh`, `update.sh`, `check.sh`, `docker/Caddyfile` et `auto-update.sh`. Ils viennent de l'étiquette de
   cette version dans le dépôt public (https://github.com/Probant-Reporting/probant), en HTTPS seulement.
4. Elle contrôle chaque fichier avec la liste des empreintes SHA-256 (une empreinte par fichier) jointe à la release
   de cette version (`probant-X.Y.Z-files.sha256`). La release est la page de la version sur GitHub, avec ses
   fichiers. La commande vérifie aussi la signature de cette liste avec cosign (l'outil de signature de Sigstore),
   quand cosign est sur le serveur ou quand Docker répond. Si la liste manque, si sa signature est refusée, ou si un
   seul fichier ne correspond pas, la commande s'arrête et n'installe rien. La commande dit ce qu'elle a vérifié.
5. Elle lance `./install.sh` avec l'image publiée de cette version. Voir « Ce que fait l'installeur ».
6. Elle pose la minuterie des mises à jour automatiques (voir la remarque plus haut).

Ce tableau présente les options de la commande :

| Option | Effet |
|---|---|
| `--version X.Y.Z` | Installe cette version au lieu de la dernière. |
| `--dir DOSSIER` | Installe dans ce dossier au lieu de `probant`. |
| `--check` | Vérifie seulement le serveur, et n'installe rien. Voir « Vérifier le serveur avant d'installer ». |
| `--auto-update off` | Installe sans les mises à jour automatiques (section 6). |
| `--domain`, `--port`, `--yes`, `--skip-check` | Options de `./install.sh`. Voir le tableau de « Ce que fait l'installeur ». |

Le contrôle des fichiers apporte cette protection :

- Il trouve un fichier changé ou abîmé en chemin (un proxy, un miroir, un cache), et une étiquette déplacée après la
  release.
- Avec la signature vérifiée, seul le workflow `image.yml` du dépôt public, pour cette étiquette, peut faire la liste.
  Chaque signature est inscrite dans le journal public de transparence de Sigstore.
- Il ne protège pas d'une personne qui peut changer le dépôt et lancer son workflow.
- Il ne contrôle ni `get.sh` lui-même (voir « Lire le script avant de le lancer »), ni la signature de l'image (voir
  « Vérifier l'image »).

Les versions publiées avant ces listes (1.0.0 et 1.0.1) n'en ont pas : la commande les refuse. Juste après une
publication, la liste peut manquer pendant une heure au plus : réessayez plus tard.

## Lire le script avant de le lancer

Si vos règles de sécurité n'autorisent pas un script à se lancer dès son téléchargement, suivez ces étapes :

1. Téléchargez le script : `curl -fsSLO https://github.com/Probant-Reporting/probant/raw/main/get.sh`.
2. Lisez-le : `less get.sh`. Le script est court, et des commentaires expliquent chaque étape. Hors du dossier de
   l'installation, il ne change que deux choses : Docker, si vous acceptez de l'installer, et la minuterie des mises
   à jour automatiques (sauf avec `--auto-update off`).
3. Lancez-le, avec les mêmes options que la commande : `sudo sh get.sh` (ou `sudo sh get.sh --domain reporting.example.com`).

Le script lance ensuite le `install.sh` de la version. Avant, vous pouvez lire `install.sh` et `update.sh` dans le
dépôt public, à l'étiquette de la version (`vX.Y.Z`).

Pour vérifier le script avant de le lancer, téléchargez-le depuis l'étiquette de la version, avec la liste des
empreintes SHA-256 de la release. Remplacez `X.Y.Z` par la version (la dernière est sur
https://github.com/Probant-Reporting/probant/releases/latest) :

```bash
curl -fsSLO https://github.com/Probant-Reporting/probant/raw/refs/tags/vX.Y.Z/get.sh
curl -fsSLO https://github.com/Probant-Reporting/probant/releases/download/vX.Y.Z/probant-X.Y.Z-files.sha256
curl -fsSLO https://github.com/Probant-Reporting/probant/releases/download/vX.Y.Z/probant-X.Y.Z-files.sha256.sigstore.json
sha256sum -c --ignore-missing probant-X.Y.Z-files.sha256
```

La dernière commande affiche `get.sh: OK`. Pour vérifier la liste elle-même, utilisez cosign version 3 ou plus
récente. Si la signature est correcte, cosign affiche `Verified OK` :

```bash
cosign verify-blob probant-X.Y.Z-files.sha256 \
  --bundle probant-X.Y.Z-files.sha256.sigstore.json \
  --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Lancez ensuite `sudo sh get.sh --version X.Y.Z`, avec les mêmes options que la commande.

## Ce que fait l'installeur

L'installeur est `./install.sh`. Il effectue ces étapes, dans cet ordre :

1. Pour une installation neuve, il vérifie le serveur (voir « Vérifier le serveur avant d'installer »). Si un point
   est à corriger, il s'arrête et n'installe rien.
2. Il vérifie que Docker répond. Si Docker manque, il propose de l'installer (voir « Installer Docker sur Debian ou
   Ubuntu »).
3. Il crée le fichier de réglages `.env` à partir de `.env.example`. Il ne remplace pas un fichier `.env` existant.
4. Il récupère l'image : il télécharge l'image publiée si `IMAGE` est renseigné dans `.env`, sinon il construit l'image.
5. Il démarre l'outil et attend qu'il réponde.
6. Il affiche l'adresse à ouvrir.

Ce tableau présente les options de `./install.sh` :

| Option | Effet |
|---|---|
| Sans option | L'outil s'ouvre en HTTP sur `http://ADRESSE-DU-SERVEUR:8000`. Utilisez-la pour un réseau interne ou un essai. |
| `--domain reporting.example.com` | L'outil s'ouvre en HTTPS. L'installeur ajoute Caddy, le proxy HTTPS fourni, devant l'outil. Caddy obtient le certificat auprès de Let's Encrypt automatiquement. Le port 8000 n'est alors ouvert qu'au serveur lui-même. |
| `--port 8080` | L'outil utilise un autre port HTTP. |
| `--image ghcr.io/probant-reporting/probant:X.Y.Z` | L'outil utilise cette image publiée (le réglage `IMAGE` de `.env`). Le serveur la télécharge et ne la construit pas. |
| `--yes` | Si Docker manque, l'installeur l'installe sans poser la question. |
| `--check` | Vérifie seulement le serveur, avec les autres options, et n'installe rien. |
| `--skip-check` | Installe sans le contrôle du serveur. |
| `--offline probant-image-X.Y.Z.tar.gz` | Installe sans accès à Internet, avec l'image du paquet hors ligne. Voir « Installer sans accès à Internet ». |
| `--cert FICHIER --key FICHIER` | Avec `--domain` : Caddy sert le certificat HTTPS de votre entreprise, et ne contacte jamais Let's Encrypt. Sur une installation qui tourne : renouvelle le certificat. Voir « Réseau d'entreprise ». |
| `--ca-cert FICHIER` | Ajoute une autorité de certification de votre entreprise pour les connexions sortantes de l'outil. Répétez l'option pour plusieurs autorités. Voir « Réseau d'entreprise ». |
| `--auto-update on` ou `off` | Pose ou retire la minuterie des mises à jour automatiques, avec une image publiée seulement. `--auto-update-time HH:MM` choisit son heure (04:00 par défaut). Voir « Mises à jour automatiques » (section 6). |

## Installer avec Git

Utilisez cette façon pour installer l'outil à partir du code, par exemple pour suivre le dépôt avec `git pull`.

Pour installer l'outil avec Git :

1. Récupérez le code et allez dans son dossier :

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Lancez l'installeur :

   ```bash
   ./install.sh                      # ou : ./install.sh --domain reporting.example.com
   ```

   Le serveur construit l'image. Pour cela, il télécharge l'image de base depuis Docker Hub et les paquets Python
   depuis PyPI. Pour utiliser l'image publiée à la place, ajoutez `--image ghcr.io/probant-reporting/probant:X.Y.Z`,
   avec la version du code.

## Installer sans le script

Pour faire la même installation à la main, dans le dossier du code (voir « Installer avec Git ») :

1. Créez le fichier de réglages : `cp .env.example .env`.
2. Ouvrez le fichier (`nano .env`) et réglez au moins `DOMAIN`.
3. Construisez et démarrez l'outil : `docker compose up -d --build`.

## Vérifier l'image

Cette partie est facultative. Elle concerne une installation qui utilise l'image publiée (`IMAGE` dans `.env`, voir
la section 4). L'installation et `./update.sh` ne vérifient pas la signature de l'image : faites-le vous-même ici si
vos règles de sécurité le demandent. Les mises à jour automatiques la vérifient avant chaque installation (section 6).

Chaque image, depuis la version 1.1.0, a ces trois éléments (les images des versions 1.0.0 et 1.0.1 n'en ont aucun) :

| Élément | Ce que c'est | Où le trouver |
|---|---|---|
| Signature | La preuve que l'image vient du workflow `image.yml` du dépôt `Probant-Reporting/probant`, pour l'étiquette de la version. Elle est faite avec cosign, sans clé : le certificat nomme le workflow et l'étiquette. | Dans le registre, à côté de l'image |
| SBOM (nomenclature logicielle) | La liste des composants de l'image (paquets du système et bibliothèques Python), au format SPDX JSON. Elle est aussi attachée à l'image sous forme d'attestation signée. | Release de la version : `probant-<version>-sbom.spdx.json` |
| Rapport des failles | Les failles connues de ces composants le jour de la construction, établies par Grype. Un tableau en texte et un fichier JSON. | Release de la version : `probant-<version>-vulnerabilities.txt` et `.json` |

La page des releases est `https://github.com/Probant-Reporting/probant/releases`. Si un fichier n'est pas dans la
release, il est dans l'artefact `probant-image-reports` de l'exécution « Docker image » de l'étiquette (onglet
**Actions**).

Pour vérifier la signature d'une image :

1. Installez cosign, version 3 ou plus récente (https://docs.sigstore.dev/cosign/system_config/installation/).
2. Lancez cette commande. Remplacez `X.Y.Z` par la version (par exemple `1.1.0`), dans l'image et dans l'étiquette :

   ```bash
   cosign verify ghcr.io/probant-reporting/probant:X.Y.Z \
     --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
     --certificate-oidc-issuer https://token.actions.githubusercontent.com
   ```

   Si la signature est correcte, cosign liste les contrôles faits, puis affiche la signature avec l'empreinte de
   l'image (`sha256:…`). Sinon, cosign affiche une erreur et s'arrête. Dans ce cas, n'utilisez pas l'image et
   signalez le problème (voir `SECURITY.md`).

3. Facultatif : pour être sûr que le serveur fait tourner exactement l'image vérifiée, mettez cette empreinte dans
   `IMAGE`. Par exemple : `IMAGE=ghcr.io/probant-reporting/probant@sha256:…`.

Pour récupérer le SBOM depuis l'image et vérifier son attestation en une seule étape, lancez cette commande :

```bash
cosign verify-attestation --type spdxjson ghcr.io/probant-reporting/probant:X.Y.Z \
  --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  | jq -r '.payload' | base64 -d | jq '.predicate' > probant-sbom.spdx.json
```

Pour lire le rapport des failles :

- Ouvrez `probant-<version>-vulnerabilities.txt`. Chaque ligne est une faille connue d'un composant : le nom du
  composant, la version installée, la version qui corrige la faille (vide s'il n'y a pas encore de correction),
  l'identifiant (CVE ou GHSA) et la gravité (Critical, High, Medium, Low, Negligible).
- La plupart des lignes concernent des paquets du système de l'image de base (`python:3.12-slim`). Beaucoup n'ont pas
  encore de correction, ou concernent une fonction que l'outil n'utilise pas.
- Le rapport informe seulement : une faille n'arrête pas la publication de l'image. La correction d'un composant
  arrive avec la version suivante de l'image.
- Le rapport donne l'état du jour de la construction. Pour refaire le contrôle plus tard avec les failles connues ce
  jour-là, analysez le SBOM. Par exemple, avec Grype : `grype sbom:probant-<version>-sbom.spdx.json`.
- Le fichier JSON a le même contenu, pour un outil de sécurité de votre organisation.

## Installer sans accès à Internet

Utilisez cette façon pour un serveur qui ne peut pas joindre Internet. Chaque version, depuis la 1.1.0, a
un paquet hors ligne : l'image de l'outil et les fichiers qui l'installent et le mettent à jour, en un seul fichier.
Rien n'est téléchargé pendant l'installation. Il n'y a pas de mises à jour automatiques : pour mettre à jour, prenez
le paquet de la nouvelle version (voir « Mettre à jour sans accès à Internet », section 6).

Ce tableau présente les fichiers du paquet hors ligne, sur la page de la version
(`https://github.com/Probant-Reporting/probant/releases`) :

| Fichier | Ce que c'est |
|---|---|
| `probant-X.Y.Z-offline.tar` | Le paquet : un dossier `probant` avec l'archive de l'image (`probant-image-X.Y.Z.tar.gz`), l'archive de l'image de Caddy (`caddy-image.tar.gz`, pour le HTTPS), `docker-compose.yml`, `.env.example`, `install.sh`, `update.sh`, `check.sh`, `docker/Caddyfile`, `VERSION` et `SHA256SUMS` (l'empreinte SHA-256 de chaque fichier) |
| `probant-X.Y.Z-offline.tar.sha256` | L'empreinte SHA-256 du paquet |
| `probant-X.Y.Z-offline.tar.sigstore.json` | La signature du paquet (paquet de signature cosign). Il contient tout ce dont cosign a besoin pour vérifier le paquet sans réseau. |

Sans accès à Internet, vous pouvez utiliser :

- L'outil, avec sa base SQLite (le réglage par défaut). Le paquet contient l'image de l'outil et l'image de Caddy.
  Il ne contient pas l'image de PostgreSQL (profil `postgres`) : voir « PostgreSQL sans accès à Internet » plus bas.
- Le HTTP sur le réseau interne (`http://ADRESSE-DU-SERVEUR:8000`).
- Le HTTPS avec le proxy de votre entreprise devant l'outil : le proxy porte le certificat et envoie les requêtes au
  port TCP 8000 du serveur, avec les en-têtes `X-Forwarded-Proto` et `X-Forwarded-For`. Réglez `DJANGO_HTTPS=1` et
  `DOMAIN` dans `.env` (section 4), puis lancez `docker compose up -d`.
- Le HTTPS avec Caddy et le certificat de votre entreprise : ajoutez `--domain`, `--cert` et `--key` à la commande de
  l'étape 7 (voir « Réseau d'entreprise »).

Sans accès à Internet, il n'y a pas de certificat automatique : l'installeur refuse `--offline` avec `--domain` seul.

Pour installer l'outil sans accès à Internet :

1. Sur un ordinateur qui a accès à Internet, téléchargez les trois fichiers de la version depuis la page de la version.
2. Sur cet ordinateur, vérifiez le paquet :
   - L'empreinte : `sha256sum -c probant-X.Y.Z-offline.tar.sha256`. La commande affiche `OK`.
   - La signature, avec cosign version 3 ou plus récente. Remplacez `X.Y.Z` par la version, dans les noms des fichiers
     et dans l'étiquette :

     ```bash
     cosign verify-blob probant-X.Y.Z-offline.tar \
       --bundle probant-X.Y.Z-offline.tar.sigstore.json \
       --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
       --certificate-oidc-issuer https://token.actions.githubusercontent.com
     ```

     Si la signature est correcte, cosign affiche `Verified OK`. Sinon, n'utilisez pas le paquet, et signalez le
     problème (voir `SECURITY.md`).
3. Facultatif : pour vérifier la signature aussi sur un ordinateur sans accès à Internet, cosign a besoin de la racine
   de confiance de Sigstore. Sur l'ordinateur qui a accès à Internet, après une première utilisation de cosign (ou
   `cosign initialize`), trouvez-la avec `find ~/.sigstore -name '*trusted_root.json'`, et copiez-la avec le paquet.
   Ajoutez ensuite `--trusted-root <ce fichier>` à la commande de l'étape 2.
4. Installez Docker Engine et son extension Compose sur le serveur, depuis le miroir de paquets de votre entreprise.
   Sans accès à Internet, l'installeur ne peut pas installer Docker.
5. Copiez `probant-X.Y.Z-offline.tar` sur le serveur, dans le dossier où vous voulez le dossier de l'outil.
6. Extrayez le paquet et allez dans son dossier :

   ```bash
   tar -xf probant-X.Y.Z-offline.tar
   cd probant
   ```

7. Lancez l'installeur avec l'archive de l'image. Ajoutez `--port 8080` pour un autre port :

   ```bash
   ./install.sh --offline probant-image-X.Y.Z.tar.gz
   ```

L'installeur effectue ces étapes, dans cet ordre :

1. Il vérifie chaque fichier du dossier avec `SHA256SUMS`. Si un fichier est abîmé ou modifié, il s'arrête et ne
   change rien.
2. Il vérifie le serveur (voir « Vérifier le serveur avant d'installer »), sans les contrôles du réseau.
3. Il crée le fichier `.env`, charge l'image dans Docker (`docker load`) et règle `IMAGE` dans `.env` sur le nom de
   cette image.
4. Il démarre l'outil sans aucun téléchargement, et attend qu'il réponde.

Après l'installation, le dossier contient encore l'archive de l'image. Vous pouvez la supprimer quand l'outil marche :
Docker garde l'image.

### PostgreSQL sans accès à Internet

Le paquet ne contient pas l'image de PostgreSQL. Pour utiliser le profil `postgres` (section 8) sans accès à Internet,
apportez l'image vous-même :

1. Sur un ordinateur qui a accès à Internet, enregistrez l'image nommée dans `docker-compose.yml` (service `db`) :

   ```bash
   docker pull postgres:16
   docker save postgres:16 | gzip > postgres-16.tar.gz
   ```

2. Copiez `postgres-16.tar.gz` sur le serveur, puis chargez-la : `docker load -i postgres-16.tar.gz`.
3. Réglez le profil `postgres` et `DATABASE_URL` dans `.env` (section 8), puis lancez `docker compose up -d --pull never`.

## Réseau d'entreprise

Cette partie est facultative. Elle concerne un serveur sur le réseau d'une entreprise, avec un ou plusieurs de ces
éléments : un certificat que votre entreprise donne pour l'adresse HTTPS, une autorité de certification de votre
entreprise (le certificat qui signe ses certificats internes) pour les connexions sortantes, et un proxy. Si votre
réseau n'utilise rien de cela, passez cette partie.

Les fichiers de cette partie vont dans le dossier `certificates/` de l'installation, à côté de `.env` :

| Dossier | Contenu | Qui le lit |
|---|---|---|
| `certificates/https/` | `certificate.pem` et `key.pem` : le certificat HTTPS de votre entreprise et sa clé privée (clé en mode `0600`, dossier en mode `0700`) | Caddy seulement. Le conteneur de l'outil ne reçoit jamais la clé : une sauvegarde de l'outil ne la contient donc jamais. |
| `certificates/ca/` | Les autorités de certification de votre entreprise (fichiers `.pem`, `.crt` ou `.cer`, mode `0644`) | L'outil, en lecture seule |

Gardez les fichiers d'origine là où votre entreprise garde ses certificats : les sauvegardes de l'outil ne les
contiennent pas.

### Utiliser le certificat HTTPS de votre entreprise

Caddy peut servir un certificat que votre entreprise donne, à la place du certificat automatique. Utilisez-le pour une
adresse qu'Internet ne peut pas joindre, ou quand la politique de sécurité de votre entreprise le demande. Caddy ne
contacte alors jamais Let's Encrypt, et le serveur n'a pas besoin d'être joignable depuis Internet.

Ce tableau montre les deux fichiers qu'il vous faut, au format PEM :

| Fichier | Contenu |
|---|---|
| Certificat | Le certificat du serveur pour le nom de domaine, puis les certificats intermédiaires (la chaîne complète) |
| Clé privée | La clé privée de ce certificat, sans mot de passe |

Pour installer l'outil avec ce certificat :

```bash
./install.sh --domain reporting.example.com --cert reporting.pem --key reporting.key
```

Avec l'installation en une commande, ajoutez les mêmes options après `sh -s --`. Sans accès à Internet, ajoutez
`--offline probant-image-X.Y.Z.tar.gz` : l'installeur charge l'image de Caddy depuis le paquet.

Avant tout changement, l'installeur contrôle les fichiers (avec `check.sh`, qui a besoin de la commande `openssl`). Ce
tableau montre les contrôles :

| Contrôle | S'il échoue |
|---|---|
| La clé privée correspond au certificat | À corriger : l'installeur s'arrête |
| Le certificat couvre le nom de domaine | À corriger : l'installeur s'arrête |
| Le certificat n'a pas expiré | À corriger : l'installeur s'arrête. Moins de 30 jours restants : un avertissement seulement |
| La chaîne est complète, jusqu'à une autorité du système ou de votre entreprise (`--ca-cert`) | Un avertissement seulement : certains navigateurs refusent une chaîne incomplète |

Avec le certificat de votre entreprise, un nom de domaine que ce serveur ne trouve pas dans le DNS ne donne qu'un
avertissement : ce sont les personnes qui ouvrent l'outil qui ont besoin du nom, pas Caddy.

Pour renouveler ou remplacer le certificat, lancez cette commande dans le dossier de l'installation :

```bash
./install.sh --cert nouveau-certificat.pem --key nouvelle-cle.key
```

La commande contrôle les nouveaux fichiers, les met en place et recharge le certificat dans Caddy, sans coupure et
sans téléchargement (aussi sans accès à Internet). La même commande fait passer une installation qui utilise le
certificat automatique au certificat de votre entreprise. Pour contrôler de nouveaux fichiers avant de renouveler,
sans rien changer : `sh check.sh --certificate-only --domain reporting.example.com --cert nouveau-certificat.pem --key nouvelle-cle.key`.

Pour remplacer les fichiers à la main : copiez-les dans `certificates/https/certificate.pem` et
`certificates/https/key.pem`, puis lancez `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --force`.
Pour revenir au certificat automatique : videz `HTTPS_CERTIFICATE=` dans `.env`, puis lancez `docker compose up -d`.

### Faire confiance à l'autorité de certification de votre entreprise

Une connexion de l'outil à un serveur qui a un certificat d'une autorité interne échoue tant que l'outil ne fait pas
confiance à cette autorité. Par exemple : le serveur d'e-mails de votre entreprise, ou un proxy qui inspecte le trafic
HTTPS. L'erreur dit « certificate verify failed ».

Pour ajouter l'autorité, donnez son certificat (format PEM) à l'installeur. Répétez l'option pour plusieurs autorités :

```bash
./install.sh --ca-cert autorite-racine-entreprise.pem
```

Sur une installation qui tourne, la même commande ajoute l'autorité et redémarre l'outil. À chaque démarrage, l'outil
réunit les autorités de `certificates/ca/` avec celles du système dans un seul fichier, `/data/ca-bundle.pem`. Toutes
les connexions sortantes de l'outil utilisent ce fichier : le serveur d'e-mails (STARTTLS et SSL) et
toute autre connexion HTTPS. Les autorités publiques restent de confiance.

L'outil n'utilise que le certificat d'une autorité. Un fichier qu'il ne peut pas lire, qui ne contient aucun
certificat, ou qui contient un certificat de serveur, est écrit dans le journal au démarrage (`docker compose logs web`)
et laissé de côté : l'outil démarre quand même. **Administration › Paramètres › Santé** montre les autorités en
service, avec leur date d'expiration, aux gestionnaires des espaces et aux administrateurs de l'espace principal. La
ligne passe à « À regarder » 30 jours avant l'expiration d'une autorité.

Pour retirer une autorité, supprimez son fichier de `certificates/ca/`, puis lancez `docker compose restart web`.

Sans Docker (hébergement géré, ou `python manage.py runserver`), réglez `EXTRA_CA_CERTS` sur le fichier, ou sur le
dossier des fichiers. Séparez-en plusieurs par `:`. Le dossier des données doit être modifiable : l'outil y écrit
`ca-bundle.pem`. Avec Python 3.13 ou plus récent, les certificats doivent avoir les identifiants de clé que demande la
RFC 5280.

Le contrôle du serveur utilise aussi l'autorité : `sh check.sh --ca-cert autorite-racine-entreprise.pem` (l'installeur
lui passe les options). Les autorités de `certificates/ca/` d'une installation sont lues sans l'option.

Docker télécharge les images lui-même, en dehors de l'outil. Derrière un proxy qui inspecte le trafic, le service
Docker doit aussi faire confiance à l'autorité : sur Debian et Ubuntu, copiez-la dans `/usr/local/share/ca-certificates/`
avec l'extension `.crt`, puis lancez `sudo update-ca-certificates` et `sudo systemctl restart docker`
(https://docs.docker.com/engine/network/ca-certs/). Une image construite sur le serveur (« Installer avec Git »)
télécharge aussi des paquets Python pendant la construction : derrière un tel proxy, utilisez l'image publiée ou le
paquet hors ligne.

### Utiliser un proxy pour les connexions sortantes

L'outil peut passer par un proxy pour ses connexions HTTPS sortantes. Ce tableau montre quoi régler :

| Quoi | Comment |
|---|---|
| Connexions HTTPS sortantes de l'outil | `HTTPS_PROXY=http://proxy.example.com:3128` dans `.env`, et `NO_PROXY` pour les adresses à joindre directement. Puis lancez `docker compose up -d`. |
| Serveur d'e-mails | La connexion SMTP n'utilise pas le proxy : ouvrez le port SMTP du serveur vers le serveur d'e-mails. |
| Contrôle du serveur | `sudo HTTPS_PROXY=http://proxy.example.com:3128 sh check.sh …` (voir « Vérifier le serveur avant d'installer ») |
| Téléchargements de Docker | Le proxy du service Docker : https://docs.docker.com/engine/daemon/proxy/ |
| Proxy qui inspecte le trafic HTTPS | Donnez son autorité avec `--ca-cert` (voir plus haut) |
