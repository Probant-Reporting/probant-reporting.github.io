---
title: "Ce qu'il faut préparer"
description: "Cette page liste ce que l'équipe informatique prépare avant l'installation de Probant, et qui fait quoi. Vous pouvez l'envoyer telle quelle à votre équipe…"
order: 0.3
group: "Before you install"
source: "docs/fr/demande_it.md"
---

Cette page liste ce que l'équipe informatique prépare avant l'installation de Probant, et qui fait quoi. Vous pouvez
l'envoyer telle quelle à votre équipe informatique.

Probant tourne sur un serveur de votre entreprise, ou sur votre propre compte chez un hébergeur clé en main. Les
personnes qui développent Probant ne l'hébergent pas et n'en reçoivent aucune donnée. Pour la revue de sécurité, voir
le [Dossier de sécurité](/docs/security-overview/).

## 1. Hébergement

Choisissez l'une des deux options. Ce tableau présente ce que l'IT fournit pour chaque option :

| Prêt | Option | Ce que l'IT fournit |
|---|---|---|
| ☐ | A. Votre propre serveur, avec Docker | Un serveur Linux 64 bits (`x86_64`), avec un compte qui peut utiliser `sudo`. Sur Debian 12 ou Ubuntu 22.04, ou une version plus récente, n'installez rien d'avance, seulement `curl` s'il manque : l'installeur propose d'installer Docker et attend votre oui. Sur un autre système Linux, installez d'abord Docker Engine 24 ou plus récent et son module Compose v2.24 ou plus récent. Git seulement pour installer avec Git (aussi sur `arm64`) |
| ☐ | B. Hébergement clé en main (Clever Cloud) | Un compte Clever Cloud avec une application Python, un add-on PostgreSQL et un add-on FS Bucket. Voir [Hébergement clé en main](/docs/managed-hosting/) |

Pour l'option A, ce tableau présente la taille du serveur :

| Prêt | Élément | Minimum | Pour un usage réel |
|---|---|---|---|
| ☐ | Processeurs | 1 | 2 à 4, réservés à l'outil. Les essais de charge ont utilisé cette taille. |
| ☐ | Mémoire | 1 Go | Chaque processus du serveur web utilise environ 170 Mo. L'outil en démarre un par processeur, de 2 à 4. |
| ☐ | Disque | 5 Go | Chaque sauvegarde est une copie complète de la base et des preuves. L'outil garde 14 sauvegardes par défaut. Prévoyez le disque pour les données et ces copies. |
| ☐ | Base de données | SQLite, dans le volume des données. Il n'y a rien à installer. | PostgreSQL quand plus d'une vingtaine de personnes sont actives au même moment |

## 2. Réseau

Ce tableau présente les accès réseau à préparer. Pour l'accès entrant, choisissez l'une des quatre lignes « Entrant » :

| Prêt | Besoin | Valeur |
|---|---|---|
| ☐ | Adresse | Un nom de domaine qui pointe vers le serveur, par exemple `reporting.example.com` |
| ☐ | Entrant, HTTPS avec le proxy Caddy fourni | TCP 80 et 443, et UDP 443, ouverts depuis Internet. Caddy obtient automatiquement un certificat Let's Encrypt. |
| ☐ | Entrant, HTTPS avec votre propre proxy et votre certificat | Votre proxy envoie les requêtes vers le port TCP 8000 du serveur, avec les en-têtes `X-Forwarded-Proto` et `X-Forwarded-For`. Choisissez cette option si le serveur n'est pas joignable depuis Internet. |
| ☐ | Entrant, HTTPS avec Caddy et le certificat de votre entreprise | TCP 443 (et 80 pour la redirection) depuis le réseau interne. Le certificat avec sa chaîne complète et sa clé privée sans mot de passe, au format PEM (`./install.sh --cert --key`). Pas de Let's Encrypt, pas d'accès depuis Internet. |
| ☐ | Entrant, essai interne seulement | TCP 8000, en HTTP sans chiffrement |
| ☐ | Sortant, installation et mises à jour | Depuis le serveur, TCP 443 : `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com` (fichiers et leurs empreintes signées), `ghcr.io`, `pkg-containers.githubusercontent.com` (image), `tuf-repo-cdn.sigstore.dev` (signatures). Si l'installeur installe Docker : aussi `download.docker.com` et les miroirs de paquets du système. Avec HTTPS (`--domain`) : aussi Docker Hub (image de Caddy). Avec Git, le serveur construit l'image : aussi Docker Hub et PyPI. Sans accès à Internet : rien, avec le paquet hors ligne de la release ([Installer sans accès à Internet](/docs/install-the-tool/#installer-sans-accès-à-internet)). |
| ☐ | Sortant, mises à jour automatiques (facultatif) | Allumées par défaut après une installation en une commande. Chaque nuit, le serveur (pas l'outil) ouvre les mêmes connexions vers GitHub et Sigstore que l'installation, TCP 443. Pour installer sans elles, ajoutez `--auto-update off` ([Mises à jour automatiques](/docs/update-the-tool/#mises-à-jour-automatiques)). |
| ☐ | Sortant, e-mails | Le serveur SMTP, sur son port : 587 pour `starttls`, 465 pour `ssl` |
| ☐ | Sortant, connexion d'entreprise (facultatif) | Votre fournisseur d'identité OpenID Connect, TCP 443, seulement si un gestionnaire des espaces allume la connexion d'entreprise. Réglez `PUBLIC_URL`, et enregistrez l'outil chez le fournisseur ([Connexion d'entreprise](/docs/single-sign-on/)). |
| ☐ | Autorité de certification interne | Si le serveur d'e-mails, ou un proxy qui inspecte le HTTPS, a un certificat d'une autorité interne : le certificat de cette autorité au format PEM (`./install.sh --ca-cert`). |

## 3. Compte e-mail (SMTP)

L'outil envoie les relances, les alertes par e-mail et l'e-mail de test avec un compte SMTP. Sans ce compte, l'outil
n'envoie aucun e-mail. Donnez ces réglages à un gestionnaire des espaces (le premier compte administrateur en est un),
qui les saisit dans **Administration › Paramètres › Hébergement**. Ou mettez-les vous-même dans `.env`. Ce tableau
présente ce qu'il faut donner :

| Prêt | Élément | Exemple |
|---|---|---|
| ☐ | Serveur et port | `smtp.office365.com`, `587` |
| ☐ | Sécurité | `starttls` (port 587), `ssl` (port 465) ou `none` |
| ☐ | Identifiant et mot de passe | Le compte qui envoie les e-mails |
| ☐ | Adresse d'expédition | `reporting@example.com` |

## 4. Sauvegardes et supervision

Ce tableau présente ce que l'IT fait tourner après l'installation :

| Prêt | Besoin | Ce qu'il faut préparer |
|---|---|---|
| ☐ | Copie externe des sauvegardes | Un emplacement hors du serveur que seule l'IT peut ouvrir : les archives contiennent des données confidentielles et les empreintes des mots de passe. Choisissez une façon. **L'outil copie lui-même chaque sauvegarde** : donnez à un gestionnaire des espaces un compartiment compatible S3 (adresse, région, compartiment, identifiant de la clé d'accès, clé secrète) ou un compte SFTP (serveur, port, nom du compte, mot de passe ou clé privée, dossier, empreinte SHA-256 de la clé du serveur). Ouvrez depuis le serveur le port de la destination : 443 ou le port de l'adresse pour S3, 22 par défaut pour SFTP. **Ou vous copiez** le dossier `/data/backups`, avec tous ses sous-dossiers, à intervalle régulier. Voir [Installer Probant](/docs/), « Copier les sauvegardes hors du serveur ». |
| ☐ | Contrôle de santé | Donnez la boîte qui doit recevoir les alertes par e-mail de l'outil (sauvegarde échouée, disque presque plein, tâche arrêtée…). Sur une installation neuve, elles sont allumées d'office (**Administration › Paramètres › Santé**). Si vous avez un outil de supervision, ajoutez aussi une sonde sur `GET /sante/` : `200` signifie que l'outil fonctionne, `503` signale un problème. Seule cette sonde vous prévient quand le serveur est éteint. |
| ☐ | Contrôle des données de la nuit | Rien à régler : un contrôle de la nuit en retard ou en erreur fait partie des alertes par e-mail de l'outil. Avec votre propre supervision, vous pouvez aussi alerter quand `controle_donnees.etat` vaut `late` dans le détail de `/sante/`. |
| ☐ | Journaux | Réglez la rotation des journaux de Docker. L'outil ne la règle pas. |

## 5. Qui fait quoi

Ce tableau présente chaque tâche, qui la fait et combien de temps elle prend :

| Tâche | Qui | Durée |
|---|---|---|
| Préparer le serveur, le nom de domaine, le pare-feu et le compte SMTP | IT | Selon vos procédures |
| Vérifier le serveur avant l'installation (`get.sh --check` ou `./install.sh --check` : il ne change rien) | IT | Quelques secondes |
| Installer l'outil (`get.sh`, ou `./install.sh` avec Git) | IT | Environ 2 minutes (3 à 5 avec Git) |
| Ou déployer l'outil sur Clever Cloud | IT | Environ 30 minutes |
| Créer le compte administrateur (étape 1 de l'assistant **Mise en place**) | IT ou l'administrateur de l'outil | Juste après l'installation |
| Faire les 7 autres étapes de l'assistant : **Votre structure**, **Langues**, **Organisation**, **Référentiels**, **Fiche KPI**, **Équipe**, **Première campagne** | Administrateur de l'outil | Selon le nombre d'organisations et de KPI. L'administrateur peut s'arrêter et reprendre plus tard. |
| Régler le serveur d'e-mails dans l'outil, et envoyer un e-mail de test (**Administration › Paramètres › Hébergement**) | Gestionnaire des espaces, ou l'IT dans `.env` | Non mesuré |
| Régler la connexion d'entreprise (facultatif) : l'application chez le fournisseur, puis **Administration › Paramètres › Connexion d'entreprise** | IT et un gestionnaire des espaces | Non mesuré |
| Créer les comptes et donner les rôles | Administrateur de l'outil | Non mesuré |
| Copier les sauvegardes hors du serveur, si l'outil ne le fait pas | IT | À intervalle régulier |
| Mettre à jour l'outil (`./update.sh`), ou laisser faire les mises à jour automatiques du serveur | IT | 1 à 3 minutes |
| Restaurer une sauvegarde | IT, ou l'administrateur de l'outil depuis la page **Hébergement** | Quelques secondes |

## 6. Étapes

Pour installer l'outil, suivez ces étapes. [Installer Probant](/docs/) donne le détail de chaque étape, et les
numéros de section ci-dessous sont ceux de ce guide :

1. Préparez les éléments des sections 1 à 4 de cette page.
2. Vérifiez le serveur, puis installez l'outil en une commande avec `--domain reporting.example.com`
   (section 2). Sur Debian et Ubuntu, si Docker manque, l'installeur propose de l'installer.
3. Ouvrez l'adresse de l'outil et créez tout de suite le compte administrateur (section 3). Tant que cette étape
   n'est pas faite, la première personne qui ouvre l'adresse crée ce compte.
4. Donnez les réglages SMTP à un gestionnaire des espaces (l'administrateur de l'étape 3 en est un), ou ajoutez-les
   dans `.env`, puis envoyez un e-mail de test (section 7).
5. Donnez à un gestionnaire des espaces la destination de la copie des sauvegardes, ou planifiez vous-même la copie de
   `/data/backups` hors du serveur (section 5).
6. Branchez votre supervision sur `/sante/` (section 9).
7. Donnez l'adresse à l'administrateur de l'outil, qui fait le reste de la mise en place.
