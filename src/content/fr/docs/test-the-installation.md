---
title: "Tester l'installation"
description: "À la fin, le script supprime tout ce qu'il a créé. Pour lancer le même test avec les tests de l'outil, lancez TESTER_DOCKER=1 python manage.py test…"
order: 11
group: "Run"
source: "docs/fr/installation.md"
---

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
