---
title: "Ce qu'il faut préparer"
description: "Le détail est dans Installer Probant et dans le Dossier de sécurité, qui contient un questionnaire de sécurité déjà rempli. La connexion d'entreprise est…"
order: 0.3
group: "Before you install"
source: "docs/fr/demande_it.md"
---

## 1. L'outil en bref

- Probant est une application web dans **un seul conteneur Docker**. Toutes ses données sont dans **un seul volume**,
  `/data` : la base, les preuves, les sauvegardes et la clé secrète. La base est SQLite, sans rien à installer.
  Choisissez PostgreSQL au-delà d'une vingtaine de personnes actives au même moment.
- Il tourne sur un serveur de votre entreprise, ou sur votre propre compte chez un hébergeur clé en main. Il n'a besoin
  d'aucun service extérieur pour tourner : les e-mails, la connexion d'entreprise et la copie externe des sauvegardes
  sont facultatifs. Les personnes qui développent Probant ne l'hébergent pas, n'en reçoivent aucune donnée et n'ont
  aucun accès à votre installation.

## 2. Ce que vous fournissez

| Prêt | Élément | Ce qu'il faut fournir |
|---|---|---|
| ☐ | Serveur | Linux 64 bits sur `x86_64` (sur `arm64`, installez avec Git), avec un compte qui peut utiliser `sudo`. Minimum : 1 processeur, 1 Go de mémoire, 5 Go de disque. Pour un usage réel : 2 à 4 processeurs. Prévoyez le disque pour les sauvegardes : chacune est une copie complète des données, et l'outil garde 14 sauvegardes par défaut. Sur Debian 12 ou Ubuntu 22.04, ou une version plus récente, n'installez rien d'avance, seulement `curl` s'il manque : le script d'installation propose d'installer Docker et attend votre oui. Sur un autre système Linux, installez d'abord Docker et son module Compose (versions dans le guide d'installation). |
| ☐ | Ou hébergement clé en main | Un compte Clever Cloud avec une application Python, un add-on PostgreSQL et un add-on FS Bucket. Voir [Hébergement clé en main](/docs/managed-hosting/). |
| ☐ | Nom de domaine, pour HTTPS | Un nom qui pointe vers le serveur, par exemple `reporting.example.com`. |
| ☐ | Compte e-mail (facultatif) | Le serveur SMTP et son port (587 pour `starttls`, 465 pour `ssl`), l'identifiant et le mot de passe, l'adresse d'expédition. Sans lui, l'outil n'envoie aucun e-mail. |
| ☐ | Lieu pour la copie des sauvegardes (conseillé) | Un bucket compatible S3 ou un compte SFTP que seule l'IT peut ouvrir : les sauvegardes contiennent des données confidentielles et les empreintes des mots de passe. Ou copiez vous-même `/data/backups` hors du serveur, à intervalles réguliers. |

## 3. Installer

1. Contrôlez le serveur. Le contrôle lit Docker, la mémoire, le disque, les ports, le nom de domaine, le réseau et
   l'horloge, et ne change rien :

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh \
     | sudo sh -s -- --check --domain reporting.example.com
   ```

2. Installez l'outil avec la même commande, sans `--check`. Comptez 2 minutes environ. La commande contrôle chaque
   fichier avec la liste signée de la release : si la liste manque ou si un fichier ne correspond pas, elle n'installe
   rien.
3. Ouvrez l'adresse et créez tout de suite le compte administrateur. D'ici là, la première personne qui ouvre
   l'adresse le crée.

Variantes :

- **Sans accès à Internet** : le paquet hors ligne signé de la release, avec `./install.sh --offline`.
- **Réseau d'entreprise** : le certificat HTTPS de votre entreprise (`--cert`, `--key`), votre autorité de
  certification interne (`--ca-cert`) et un proxy pour les connexions sortantes (`HTTPS_PROXY`).
- **Avec Git** : le serveur construit l'image, en 3 à 5 minutes.

## 4. Réseau

Pour l'accès entrant, choisissez une ligne :

| Accès entrant | Ports |
|---|---|
| HTTPS avec le proxy Caddy fourni | TCP 80 et 443, et UDP 443, ouverts depuis Internet. Caddy obtient automatiquement un certificat Let's Encrypt. |
| HTTPS avec le certificat de votre entreprise | TCP 443, et 80 pour la redirection, depuis le réseau interne. Aucun accès depuis Internet. |
| HTTPS avec votre propre proxy | Votre proxy envoie les requêtes au port TCP 8000, avec les en-têtes `X-Forwarded-Proto` et `X-Forwarded-For`. |
| Essai interne seulement | TCP 8000, en HTTP sans chiffrement |

Les connexions sortantes, toutes en TCP 443 sauf le serveur d'e-mails et SFTP :

| Usage | Destinations, depuis le serveur |
|---|---|
| Installation et mises à jour | `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, `ghcr.io`, `pkg-containers.githubusercontent.com`, `tuf-repo-cdn.sigstore.dev`. Avec HTTPS (`--domain`) : aussi Docker Hub. Si le script d'installation installe Docker : aussi `download.docker.com` et les miroirs de paquets du système. Avec le paquet hors ligne : rien. |
| Mises à jour automatiques | Les mêmes hôtes GitHub et Sigstore, chaque nuit, depuis le serveur (pas depuis l'outil) |
| E-mails (facultatif) | Votre serveur SMTP, sur son port |
| Copie des sauvegardes (facultatif) | La destination S3 (443, ou le port de son adresse) ou le serveur SFTP (22 par défaut) |
| Connexion d'entreprise (facultatif) | Votre fournisseur d'identité OpenID Connect |

## 5. Après l'installation

Ce tableau présente ce qui tourne tout seul, et ce qui reste à l'IT :

| Sujet | Tout seul | Ce que fait l'IT |
|---|---|---|
| Mises à jour | Après une installation en une commande, le serveur installe chaque nouvelle version la nuit, 3 jours après sa publication. Il n'installe qu'une image signée, sauvegarde d'abord chaque espace, et revient en arrière si la nouvelle version ne répond pas. | Pour les éteindre : `--auto-update off` à l'installation, ou le choix **Éteint** dans l'outil. Sinon, lancez `./update.sh` (1 à 3 minutes). |
| Sauvegardes | Chaque nuit. Elles sont signées, pas chiffrées. | Copiez-les hors du serveur, ou donnez la destination à un gestionnaire des espaces. Chiffrez le disque. |
| Alertes par e-mail | Sauvegarde échouée, disque presque plein, tâche arrêtée, copie échouée, et d'autres. Sur une installation neuve, elles sont allumées d'office (**Administration › Paramètres › Santé**). | Donnez la boîte qui les reçoit. |
| Page de santé | `GET /sante/` répond `200` quand l'outil fonctionne, `503` quand il y a un problème. | Posez-y une supervision : elle seule vous prévient quand le serveur est éteint. |
| Journaux | L'outil les écrit sur la sortie standard du conteneur. | Réglez la rotation des journaux de Docker. |

## 6. La sécurité en bref

- Chaque image est signée, avec sa liste de composants (SBOM) jointe. Chaque release contient un rapport des failles
  connues.
- Le conteneur tourne sous l'utilisateur 1000. Le code appartient à root, et l'outil ne peut pas le modifier. Seule la
  dernière version reçoit les corrections de sécurité.
- La connexion d'entreprise passe par OpenID Connect. Elle est éteinte par défaut, et les comptes restent créés dans
  l'outil. Il n'y a ni SAML, ni LDAP, ni second facteur propre à l'outil.
- Les secrets enregistrés dans l'outil (mot de passe des e-mails, secrets de la copie externe, secret du client de la
  connexion d'entreprise) sont chiffrés. L'outil ne les réaffiche jamais.
- Aucune télémétrie : l'outil n'envoie rien aux personnes qui le développent, et ses pages ne chargent rien d'un autre
  site.
- En HTTPS, l'outil envoie HSTS et une politique de sécurité des contenus stricte. Une session se termine après
  12 heures sans activité. Des échecs de connexion répétés bloquent la connexion pendant 15 minutes.
- Non fournis : aucune certification (ISO 27001, SOC 2), aucun test d'intrusion par un tiers, aucun chiffrement des
  données ni des sauvegardes par l'outil, aucune analyse antivirus des preuves et aucune haute disponibilité.

## 7. Qui fait quoi

| Qui | Tâches |
|---|---|
| L'IT | Serveur, nom de domaine, pare-feu, compte e-mail. L'installation et le premier compte administrateur. La copie des sauvegardes, la supervision, les journaux. Les mises à jour à la main, ou la tâche planifiée des mises à jour automatiques. |
| Un gestionnaire des espaces (le premier administrateur en est un) | Les réglages de toute l'installation : serveur d'e-mails, alertes par e-mail, mises à jour automatiques, copie externe des sauvegardes, connexion d'entreprise |
| Les administrateurs de l'outil | L'assistant de mise en place, les comptes et les rôles, les référentiels, les campagnes |

## 8. Où trouver le reste

Le détail est dans [Installer Probant](/docs/) et dans le [Dossier de sécurité](/docs/security-overview/), qui
contient un questionnaire de sécurité déjà rempli. La connexion d'entreprise est dans
[Se connecter avec le compte d'entreprise](/docs/single-sign-on/), Clever Cloud dans
[Hébergement clé en main](/docs/managed-hosting/), et comment signaler une faille en privé dans
[`securite.md`](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md).
