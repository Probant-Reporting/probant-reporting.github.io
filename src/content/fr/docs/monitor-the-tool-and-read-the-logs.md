---
title: "Superviser l'outil et lire les journaux"
description: "La page ne demande aucune connexion et n'expose aucune donnée sensible. Docker s'en sert aussi : docker compose ps affiche healthy."
order: 9
group: "Run"
source: "docs/fr/installation.md"
---

## Vérifier que l'outil va bien

`GET /sante/` répond avec l'un de ces codes :

- `200` avec `{"etat": "ok"}` : l'outil fonctionne.
- `503` avec `{"etat": "erreur"}` : la base ou le stockage a un problème, la base est abîmée, une restauration a été
  interrompue, ou le disque est presque plein (moins de 100 Mo libres, réglage `DISK_ALERT_MB`). Le détail donne la
  cause dans `alerte`.

La page ne demande aucune connexion et n'expose aucune donnée sensible. Docker s'en sert aussi : `docker compose ps`
affiche `healthy`.

L'outil ne donne le détail de toute l'installation qu'à un appel depuis le serveur lui-même (depuis `127.0.0.1`, sans
aucun des en-têtes qu'ajoute un proxy : `X-Forwarded-For`, `X-Real-IP`, `Forwarded`), à un gestionnaire des espaces
connecté et à un administrateur de l'espace principal connecté. L'administrateur d'un autre espace reçoit le détail de
son espace seulement : le registre commun et le disque sont mesurés, mais les noms, pannes et tâches bloquées des autres
espaces et les dossiers du disque ne sont pas montrés. Les autres personnes reçoivent l'état seul. La raison : la version
exacte aiderait à repérer une installation pas à jour, et l'administrateur d'un espace n'a pas à connaître les autres
espaces. Pour voir le détail depuis le serveur, lancez cette commande :

```bash
docker compose exec web python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/sante/').read().decode())"
```

Ce tableau présente les champs du détail :

| Champ | Contenu |
|---|---|
| `version`, `base`, `stockage`, `derniere_sauvegarde` | La version, l'état de la base et du stockage, et la date de la dernière sauvegarde |
| `alerte` | La cause d'une réponse `503` |
| `avertissement` | Un avertissement qui ne cause pas de `503`, par exemple un import ou un export bloqué, ou une sauvegarde datée dans le futur |
| `controle_donnees` | Le dernier contrôle des données : `etat` (`ok`, `problems`, `late` sans contrôle des données depuis 48 heures, `never`), `date`, `erreurs`, `avertissements` |
| `background_imports` | L'état des imports en arrière-plan (voir « Vérifier qu'un gros import n'est pas bloqué ») |
| `background_exports` | L'état des gros exports en arrière-plan : `running`, `waiting`, `stuck` (même section) |

Un problème de données ou un contrôle en retard ne fait **jamais** répondre `503` à `/sante/`. `503` veut dire
« l'outil ne répond pas ». Docker ou Clever Cloud redémarrent alors l'outil, et un redémarrage ne corrige ni un
chiffre ni un planificateur arrêté. Pour surveiller le contrôle de chaque nuit, créez une alerte sur
`controle_donnees.etat` = `late`.

Les administrateurs lisent les mêmes mesures, en clair, dans **Administration › Paramètres › Santé** : une ligne par
contrôle (version, base de données, fichiers, dernière sauvegarde, espace disque, e-mails, tâches de fond, mise à jour de
la base, HTTPS), avec **Bon**, **À regarder** ou **En panne** et que faire. Le détail pour l'IT (noms des espaces, dossiers
du disque, messages de `/sante/`) n'est montré qu'aux gestionnaires des espaces et aux administrateurs de l'espace principal.
La même règle vaut pour le volet « Pour l'IT » de **Paramètres › Hébergement** : dans un autre espace, l'administrateur qui
n'est pas gestionnaire des espaces ne voit ni le dossier des données, ni les adresses permises, ni le serveur de la base,
ni l'identifiant SMTP, ni le dossier des sauvegardes.

## Vérifier que les données sont cohérentes

Chaque nuit à `DATA_CHECK_TIME` (03:30), l'outil vérifie la base de chaque espace. Il **ne modifie rien**. Il vérifie
ces points :

- Chaque total et chaque calcul enregistré, dans les périodes non clôturées : l'outil le refait en mémoire et compare
  (pour les périodes clôturées, il signale seulement)
- Aucune valeur rattachée à un KPI ou une organisation supprimés, à une période sans campagne, ou enregistrée deux fois
- Des statuts cohérents
- Des pourcentages plausibles (−100 % à 1 000 %)
- Les chiffres de KPI calculés importés tels quels dans une période ouverte
- Les attributions des campagnes ouvertes à des comptes inactifs ou en lecture seule, ou à des organisations fermées
- Les fichiers des preuves présents sur le disque (et les fichiers restés dans `files/evidence`)
- Les formules et leurs dépendances enregistrées
- Un arbre sans boucle, aux niveaux cohérents
- Une dernière sauvegarde lisible (zip valide, `backup.json`)

L'outil garde les 10 derniers résultats dans `backups/data-checks.json`, hors de la base, comme `restores.jsonl`.
L'administrateur les voit dans **Administration › Paramètres › Hébergement**, dans l'encart **Contrôle des données**.
Cet encart a le bouton **Contrôler maintenant**. Quand le contrôle trouve un problème, il apparaît aussi dans
**À traiter**.

Pour lancer le contrôle à la main, lancez `docker compose exec web python manage.py check_data`. Le nom français
`controler_donnees` fonctionne aussi. La commande a ces options et ces résultats :

- Sortie : texte lisible en anglais, ou JSON avec `--json`
- `--no-save` : l'outil ne garde pas le résultat
- `SPACE=<code>` : un seul espace
- Code de sortie 1 si le contrôle trouve une erreur
- Durée : quelques secondes (6 s sur la démo, avec 6 exercices)

## Éléments supprimés (corbeille) et sessions terminées

Quand une personne supprime un export enregistré, une liste de KPI ou une vue de la Visualisation, l'outil le garde
dans une corbeille, pour que la personne puisse annuler la suppression ou restaurer l'élément depuis
**Mon compte › Récemment supprimés**. Un administrateur voit les éléments de tous dans
**Administration › Historique › Récemment supprimés**. La corbeille garde les éléments 30 jours par défaut. Un
administrateur règle ce délai, de 1 à 365 jours, dans **Administration › Paramètres › Hébergement**, encart
**Éléments supprimés**. Après ce délai, l'outil efface l'élément pour de bon.

Le processus `check_data --schedule` fait aussi un ménage chaque nuit à `DATA_CHECK_TIME`, et une fois à son lancement :

- Il efface les sessions terminées, comme `manage.py clearsessions`. Les sessions de tous les espaces sont dans le
  registre commun. Une session encore valide n'est jamais effacée.
- Il efface les éléments supprimés depuis plus longtemps que le délai, dans chaque espace.
- Il écrit une ligne dans le journal : `Nightly clean-up: N expired session(s) and N deleted item(s) erased for good`.

Vous n'avez rien à planifier. L'outil le fait aussi à chaque démarrage (`manage.py startup`), et efface les anciens
éléments supprimés à chaque suppression. Pour effacer les éléments supprimés à la main, lancez
`docker compose exec web python manage.py purge_deleted` (nom français : `purger_corbeille` ; `SPACE=<code>` pour un
seul espace). Pour effacer les sessions terminées à la main, lancez
`docker compose exec web python manage.py clearsessions`.

## Vérifier qu'un gros import n'est pas bloqué

Le même processus fabrique les gros exports (au-delà du seuil que l'administrateur règle dans **Administration ›
Paramètres › Hébergement › Gros exports**) : leurs fichiers sont dans `files/exports/` du dossier des données, effacés
après 7 jours, jamais dans les sauvegardes (rien à copier).

Les gros imports de valeurs se font en arrière-plan, dans le processus `run_imports --schedule`. L'image lance ce
processus à côté des sauvegardes, des relances et du contrôle des données. Le détail de `/sante/` donne
`background_imports` pour les imports et `background_exports` pour les gros exports, avec les trois mêmes champs :

- `running` : le nombre d'imports (ou d'exports) qui tournent
- `waiting` : le nombre d'imports (ou d'exports) qui attendent
- `stuck`, avec un `message` (repris dans `avertissement`) : un import (ou un export) qui ne donne plus signe de vie,
  ou qui attend depuis plus de 10 minutes

Si un import ou un export est bloqué :

1. Vérifiez que le processus tourne : `docker compose logs web | grep "Background"`.
2. Si besoin, redémarrez l'outil : `docker compose restart web`.

Un import ou un export bloqué ne fait jamais répondre `503` à `/sante/`. Si un redémarrage arrête une tâche, la tâche
reprend une fois d'elle-même. Ensuite, l'outil la marque « interrompue » : il invite la personne à réimporter le
fichier, ou à redemander l'export.

## Lire le journal et gérer les services

Ce tableau présente les autres opérations de supervision :

| Pour… | Faire |
|---|---|
| Lire le journal | Lancez `docker compose logs -f web`. Chaque ligne porte la date. Le journal contient le démarrage (version, base, adresses, e-mails), chaque requête (adresse, page, code, durée), les sauvegardes et les erreurs. Comme ce qu'affichent les commandes `manage.py`, le journal est toujours en anglais, quelle que soit la langue de l'interface. |
| Voir l'état des services | Lancez `docker compose ps`. |
| Redémarrer | Lancez `docker compose restart web`. |
| Arrêter, puis relancer | Lancez `docker compose down`, puis `docker compose up -d`. Les données restent dans le volume. |
