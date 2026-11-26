---
title: "Tester l'installation"
description: "Cette partie s'adresse aux personnes qui modifient le code de l'outil. Vous n'en avez pas besoin pour installer l'outil. Les scripts d'essai sont dans le…"
order: 11
group: "Run"
source: "docs/fr/installation.md"
---

Cette partie s'adresse aux personnes qui modifient le code de l'outil. Vous n'en avez pas besoin pour installer
l'outil. Les scripts d'essai sont dans le code (dossier `docker/`), pas dans le dossier d'une installation en une
commande.

Le script `bash docker/test_installation.sh` reproduit une installation sur une machine vierge. Il copie le dépôt dans
un dossier vide et lance `./install.sh`. Ensuite, il vérifie ces points :

- La page de santé
- L'assistant, affiché à la place de la page de connexion
- Les fichiers statiques et la compression
- Les en-têtes de sécurité
- `check --deploy` en HTTPS
- La sauvegarde
- La mise à jour, avec une sauvegarde faite avant
- Les données, gardées après la mise à jour

À la fin, le script supprime tout ce qu'il a créé. Pour lancer le même test avec les tests de l'outil, lancez
`TESTER_DOCKER=1 python manage.py test parametres.test_hebergement`.

Le script `bash docker/test_get.sh` teste l'installation en une commande. Il sert une copie locale du dépôt public et
un registre d'images local, puis lance `get.sh` par un tube, comme à la section 2. Les listes d'empreintes des
releases locales sont signées avec une clé d'essai de cosign. Avant, il vérifie les refus : un fichier de l'étiquette
changé, la liste changée après sa signature, et une release sans liste. Ensuite, il vérifie la mise à jour vers une
version plus récente et le retour à la version précédente (section 6). Les variables `PROBANT_TEST_SOURCE`,
`PROBANT_TEST_IMAGE`, `PROBANT_TEST_OS_RELEASE`, `PROBANT_TEST_SKIP_CHECK`, `PROBANT_TEST_COSIGN_KEY` et
`PROBANT_TEST_COSIGN_IMAGE` des scripts servent seulement à ces tests : ne les réglez pas sur un serveur. Les deux
variables de cosign ne sont lues qu'avec une source ou une image d'essai (`PROBANT_TEST_SOURCE`, `PROBANT_TEST_IMAGE`) :
les fichiers et l'image du dépôt public sont toujours vérifiés avec son identité.

Le script `bash docker/test_offline.sh` teste l'installation sans accès à Internet. Il fabrique les paquets hors ligne
de deux versions avec `docker/make_offline_package.sh`, à partir de l'image du dossier. Ensuite, il joue un serveur sans
accès à Internet : le nom de l'image pointe vers un registre où rien ne répond, `curl` et `wget` échouent, Docker ne
doit télécharger aucune image et, quand le système le permet, les scripts tournent sans aucun réseau (`unshare --net`). Il vérifie l'installation (`./install.sh --offline`), la mise à jour vers la seconde
version (`./update.sh --offline`), le refus d'un paquet plus ancien, et le retour à la première version (section 6).

Le script `bash docker/test_custom_certificate.sh` teste le réseau d'entreprise (section 2, « Réseau d'entreprise »).
Il crée une autorité de certification d'essai et un certificat de serveur signé par elle. Ensuite, il installe l'outil
avec `--domain`, `--cert`, `--key` et `--ca-cert`, et vérifie ces points : Caddy sert ce certificat (`curl --cacert`),
la page de santé répond en HTTPS, Caddy ne contacte jamais Let's Encrypt, la clé n'entre jamais dans le conteneur de
l'outil, une connexion HTTPS sortante de l'outil fait confiance à l'autorité, et le renouvellement. Puis il refait le
même essai sans accès à Internet, depuis un paquet hors ligne. `TEST_HTTPS_PORT` et `TEST_HTTP_PORT` choisissent
d'autres ports que 443 et 80.

Le script `bash docker/test_auto_update.sh` teste les mises à jour automatiques (section 6), avec un registre d'images
local, une copie locale du dépôt public et une clé d'essai de cosign. Sur une installation faite par `get.sh`, il joue
les choix « Éteint » et « Prévenir seulement », l'attente après la publication, une signature absente ou fausse, une
liste d'empreintes absente ou modifiée, une nouvelle version qui ne démarre pas (retour arrière, avec et sans
restauration), le verrou partagé avec `./update.sh`, et une mise à jour réussie. Il demande Docker et cosign 3
(`COSIGN_BINARY`). La signature faite par le workflow du dépôt public ne se vérifie que sur GitHub, à chaque version
publiée.
