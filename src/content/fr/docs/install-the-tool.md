---
title: "Installer l'outil"
description: "Installer l'outil : un guide pour l'équipe informatique, tiré de la documentation de l'outil."
order: 2
group: "Get started"
source: "docs/fr/installation.md"
---

Pour installer l'outil :

1. Récupérez le code et allez dans son dossier :

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Lancez l'installeur :

   ```bash
   ./install.sh                      # ou : ./install.sh --domain reporting.example.com
   ```

   Le script affiche l'adresse à ouvrir.

Le script effectue ces étapes, dans cet ordre :

1. Il vérifie que Docker répond.
2. Il crée le fichier de réglages `.env` à partir de `.env.example`. Il ne remplace pas un fichier `.env` existant.
3. Il construit l'image et démarre l'outil.
4. Il attend que l'outil réponde.
5. Il affiche l'adresse à ouvrir.

Ce tableau présente les options de `./install.sh` :

| Option | Effet |
|---|---|
| Sans option | L'outil s'ouvre en HTTP sur `http://ADRESSE-DU-SERVEUR:8000`. Utilisez-la pour un réseau interne ou un essai. |
| `--domain reporting.example.com` | L'outil s'ouvre en HTTPS. Le script ajoute Caddy devant l'outil, et Caddy obtient le certificat automatiquement. Le port 8000 n'est alors ouvert qu'au serveur lui-même. |
| `--port 8080` | L'outil utilise un autre port HTTP. |

## Installer sans le script

Pour faire la même installation à la main :

1. Créez le fichier de réglages : `cp .env.example .env`.
2. Ouvrez le fichier (`nano .env`) et réglez au moins `DOMAIN`.
3. Construisez et démarrez l'outil : `docker compose up -d --build`.
