---
title: "Utiliser PostgreSQL"
description: "SQLite est la base par défaut. Vous n'avez aucun serveur de base de données à gérer. SQLite écrit un enregistrement à la fois. Les autres enregistrements…"
order: 8
group: "Run"
source: "docs/fr/installation.md"
---

SQLite est la base par défaut. Vous n'avez aucun serveur de base de données à gérer. SQLite écrit un enregistrement à
la fois. Les autres enregistrements attendent leur tour, jusqu'à 60 secondes.

## Capacité

Deux essais de charge ont mesuré la capacité. La capacité dépend de la taille de la base, car chaque enregistrement
recalcule les totaux qu'il change. Ce tableau présente les résultats :

| Base | Mesure | Résultat |
|---|---|---|
| Petite (la démo) | Essai de charge, SQLite, serveur de 2 à 4 processeurs utilisés par l'outil seul | Confortable jusqu'à une centaine de personnes qui saisissent au même moment |
| Grosse (679 organisations, 1,27 million de réponses) | Essai de charge (`qa/load/README.md`, en anglais). Chaque personne simulée travaille environ dix fois plus vite qu'une vraie personne. | SQLite : 10 personnes très actives sans erreur. À partir de 15 à 20 personnes, des enregistrements échouent avec « base verrouillée » (« database is locked »). PostgreSQL : 50 personnes sans erreur ni enregistrement perdu, mais les enregistrements attendent leur tour. |

Conseil : passez à PostgreSQL au-delà d'une vingtaine de personnes actives en même temps. Passez aussi à PostgreSQL si le
serveur fait tourner d'autres programmes lourds, et donnez plus de processeurs au serveur.

Pendant les jours les plus chargés d'une campagne, évitez les opérations qui refont tout d'un coup :

- **Refaire tous les calculs** d'une campagne
- Rouvrir une campagne clôturée
- Ajouter ou désactiver une organisation
- Un import de plusieurs milliers de lignes

L'outil écrit un import par paquets de 100 lignes. Les autres personnes ne sont pas bloquées, mais l'import dure plus
longtemps. Au-delà de `BACKGROUND_IMPORT_ROWS` lignes, l'import se fait en arrière-plan, un import à la fois.

## Passer à PostgreSQL

Vous pouvez passer à PostgreSQL de 2 façons. Ce tableau présente les réglages dans `.env` pour chaque façon :

| Option | Réglage dans `.env` |
|---|---|
| PostgreSQL fourni dans le même fichier | `COMPOSE_PROFILES=postgres` et `DATABASE_URL=postgres://probant:MOT_DE_PASSE@db:5432/probant`, où `MOT_DE_PASSE` est la valeur de `POSTGRES_PASSWORD`. |
| Serveur PostgreSQL existant | `DATABASE_URL=postgres://utilisateur:motdepasse@serveur:5432/base`. Encodez un caractère spécial du mot de passe. Par exemple, `@` devient `%40`. |

Avec PostgreSQL, la sauvegarde contient la base au format JSON. Vous ne pouvez la restaurer qu'avec la version de
l'outil qui l'a faite. Pour revenir à la version précédente après une mise à jour, voyez
[Revenir à la version précédente](/docs/update-the-tool/#revenir-à-la-version-précédente).

Après un gros chargement en une seule étape, l'outil met à jour les statistiques du planificateur de PostgreSQL
(`ANALYZE` sur les tables de l'espace). Un gros chargement est une restauration, l'installation ou la mise à jour d'un
modèle de la bibliothèque, l'import d'un fichier de configuration ou une reprise de données. L'utilisateur de la base
doit être propriétaire des tables de l'outil. C'est le cas quand l'outil les crée. Si `ANALYZE` échoue, l'opération est
gardée et le journal affiche un avertissement. PostgreSQL met alors à jour les statistiques lui-même, quelques minutes
plus tard.

## Passer d'une installation SQLite existante à PostgreSQL

Faites ce passage quand personne ne travaille dans l'outil : tout ce que les personnes saisissent après les sauvegardes de
l'étape 1 est perdu. Gardez le même dossier des données (le même volume `/data`), utilisez une base PostgreSQL vide et
gardez la même version de l'outil.

Le passage demande ces archives : une sauvegarde au format JSON pour **chaque espace**, et une archive du **registre
commun** (comptes, liste des espaces, accès). Le nouveau registre PostgreSQL a une nouvelle identité. Sans l'archive du
registre, l'outil refuse la sauvegarde de l'espace principal (« une autre installation »).

Faites ces étapes dans cet ordre :

1. Sauvegardez chaque espace au format JSON. Lancez `docker compose exec web python manage.py backup --json` pour l'espace
   principal, et `docker compose exec -e SPACE=<code> web python manage.py backup --json` pour chaque autre espace. La
   commande `docker compose exec web python manage.py spaces` liste les espaces et leurs codes.
2. Faites une archive du registre commun :
   `docker compose exec web python manage.py shell -c "from parametres import sauvegardes as SV; print(SV.creer_registre('before-postgresql'))"`.
   L'outil en fait aussi une chaque jour dans `backups/shared/` : utilisez-la seulement si personne n'a créé ni modifié de
   compte depuis.
3. Notez le nom de chaque archive : `backups/` (espace principal), `backups/spaces/<code>/` (autres espaces),
   `backups/shared/` (registre). Copiez les trois dossiers hors du serveur.
4. Changez `DATABASE_URL` dans `.env`.
5. Lancez `docker compose up -d`. L'outil démarre avec une base vide et affiche l'assistant de mise en place. N'utilisez pas
   l'assistant.
6. Restaurez le registre commun : `docker compose exec web python manage.py restore --shared <archive du registre> --yes`.
   La commande peut se terminer par une erreur de base de données sur une table qui n'existe pas (`relation
   "referentiel_utilisateur" does not exist`). C'est normal, car les autres espaces n'ont pas encore de tables. Le registre
   est restauré. Lancez `docker compose exec web python manage.py spaces` pour vérifier qu'il liste vos espaces.
7. Restaurez l'espace principal : `docker compose exec web python manage.py restore <archive de l'espace principal> --yes`.
8. Restaurez chaque autre espace : `docker compose exec -e SPACE=<code> web python manage.py restore <archive de cet espace> --yes --rebuild`.
   L'option `--rebuild` crée les tables de l'espace dans PostgreSQL avant de charger l'archive.
9. Lancez `docker compose restart web`. Connectez-vous et vérifiez les valeurs de chaque espace.

Si l'installation n'a que l'espace principal, vous pouvez faire plus court. Sautez les étapes 2, 6 et 8, et ajoutez
`--other-space` à l'étape 7. L'outil recrée alors le registre à partir des comptes de l'espace principal. Il ne garde ni le
nom de l'espace, ni les comptes qui n'existent que dans un autre espace.

La commande `python manage.py shell` de l'étape 2 est le seul moyen de faire une archive du registre à la demande : l'outil n'a
pas de commande pour cela. Nous avons comparé les données de l'installation PostgreSQL à celles de l'installation SQLite,
table par table, pour deux espaces : elles sont identiques (seuls les numéros des lignes d'accès du registre changent).

## Plusieurs espaces avec PostgreSQL

Chaque espace (département) ouvre ses propres connexions à la base. Avant de créer beaucoup d'espaces, vérifiez la
limite de connexions de votre offre (petites offres Clever Cloud). Voir docs/spaces.md (en anglais).
