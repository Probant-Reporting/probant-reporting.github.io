---
title: "Prérequis"
description: "Le serveur n'a besoin ni de Python, ni d'un serveur web, ni d'une base de données. Tout est dans l'image."
order: 1
group: "Get started"
source: "docs/fr/installation.md"
---

Ce tableau présente ce qu'il faut avant d'installer l'outil :

| Besoin | Minimum conseillé |
|---|---|
| Serveur | Linux 64 bits sur `x86_64` (sur `arm64`, seulement avec l'installation par Git), par exemple Debian 12 ou plus récent, ou Ubuntu 22.04 ou plus récent. 1 processeur, 1 Go de mémoire, 5 Go de disque |
| Logiciels | Sur Debian ou Ubuntu : rien à installer d'avance, sauf `curl` s'il manque. L'installeur propose d'installer Docker, et attend votre oui. Sur un autre système Linux : installez d'abord Docker Engine 24 ou plus récent avec l'extension Compose v2.24 ou plus récente (`docker compose version`). Git seulement pour installer avec Git |
| Compte | Un compte qui peut utiliser `sudo` |
| Réseau, accès interne | 1 port ouvert vers le serveur (8000 par défaut) |
| Réseau, accès HTTPS | Un nom de domaine qui pointe vers le serveur (par exemple `reporting.example.com`), et les ports 80 et 443 (TCP, et UDP 443 pour HTTP/3) ouverts depuis Internet (certificat Let's Encrypt automatique). Avec le certificat de votre entreprise, Internet n'a pas besoin de joindre le serveur : voir « Réseau d'entreprise » |
| Réseau, téléchargements | Connexions HTTPS sortantes (TCP 443) du serveur, pendant l'installation et chaque mise à jour : `github.com` et `raw.githubusercontent.com` (fichiers), `objects.githubusercontent.com` et `release-assets.githubusercontent.com` (liste des empreintes des fichiers, jointe à la release), `ghcr.io` et `pkg-containers.githubusercontent.com` (image de l'outil et conteneur de cosign), `tuf-repo-cdn.sigstore.dev` (racine de confiance de Sigstore, pour vérifier les signatures). Avec le HTTPS (`--domain`) : aussi Docker Hub (image de Caddy). Avec Git : aussi Docker Hub et PyPI (le serveur construit l'image). Avec les mises à jour automatiques (section 6), le serveur ouvre les mêmes connexions la nuit. Pour installer Docker par l'installeur : `download.docker.com` et les miroirs de paquets du système. Sans accès à Internet : aucune (voir « Installer sans accès à Internet ») |
| E-mails (facultatif) | Un compte SMTP (serveur, port, identifiant, mot de passe, adresse d'expédition) |

Le serveur n'a besoin ni de Python, ni d'un serveur web, ni d'une base de données. Tout est dans l'image.

## Installer Docker sur Debian ou Ubuntu

Si Docker manque, l'installeur pose cette question :
`Install Docker now, from Docker's apt repository (download.docker.com)? [y/N]`. Tapez `y` pour l'installer. Toute
autre réponse arrête l'installeur, et rien ne change.

L'installeur suit la procédure officielle de Docker (https://docs.docker.com/engine/install/) : il ajoute le dépôt apt
de Docker, vérifié par la clé de Docker, puis installe les paquets `docker-ce`, `docker-ce-cli`, `containerd.io`,
`docker-buildx-plugin` et `docker-compose-plugin`. Ses règles sont les suivantes :

- Il n'installe jamais Docker sans un oui. Sans terminal (un déploiement automatique, par exemple), ajoutez l'option
  `--yes` pour répondre oui.
- Il n'installe Docker que sur Debian et Ubuntu. Sur un autre système, il s'arrête : installez Docker vous-même, puis
  relancez l'installeur.
- Il a besoin des droits d'administration : lancez-le en `root` ou avec `sudo`. Sinon, il s'arrête et ne change rien.

Pour utiliser Docker sans `sudo`, ajoutez votre compte au groupe `docker` (`sudo usermod -aG docker $USER`), puis
déconnectez-vous et reconnectez-vous. Un membre de ce groupe a les mêmes droits que `root` sur le serveur.
