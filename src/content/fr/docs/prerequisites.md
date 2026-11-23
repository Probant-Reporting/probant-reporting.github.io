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
| Serveur | Linux 64 bits (Debian 12, Ubuntu 22.04 ou plus récent), 1 processeur, 1 Go de mémoire, 5 Go de disque |
| Logiciels | Docker Engine 24 ou plus récent avec le module Compose v2.24 ou plus récent (`docker compose version`), Git |
| Réseau, accès interne | 1 port ouvert vers le serveur (8000 par défaut) |
| Réseau, accès HTTPS | Un nom de domaine qui pointe vers le serveur (par exemple `reporting.example.com`), et les ports 80 et 443 ouverts depuis Internet (certificat Let's Encrypt automatique) |
| E-mails (facultatif) | Un compte SMTP (serveur, port, identifiant, mot de passe, adresse d'expédition) |

Le serveur n'a besoin ni de Python, ni d'un serveur web, ni d'une base de données. Tout est dans l'image.

## Installer Docker sur Debian ou Ubuntu

La procédure officielle est sur https://docs.docker.com/engine/install/. En résumé, lancez ces commandes :

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # puis se déconnecter et se reconnecter
docker compose version            # doit afficher v2.24 ou plus
```
