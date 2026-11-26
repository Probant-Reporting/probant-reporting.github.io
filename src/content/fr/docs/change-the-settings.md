---
title: "Modifier les réglages (fichier .env)"
description: "Les réglages sont dans le fichier .env. Le fichier .env.example explique chaque ligne. Pour appliquer une modification, lancez docker compose up -d. Un…"
order: 4
group: "Run"
source: "docs/fr/installation.md"
---

Les réglages sont dans le fichier `.env`. Le fichier `.env.example` explique chaque ligne. Pour appliquer une
modification, lancez `docker compose up -d`. Un réglage sans valeur garde sa valeur par défaut.

L'outil accepte encore les anciens noms français des réglages (`DOMAINE`, `PORT_HTTP`, `SMTP_HOTE`…). Ils peuvent être dans
d'anciens fichiers `.env`. Utilisez les noms du tableau qui suit.

Ce tableau présente chaque réglage, sa valeur par défaut et son rôle :

| Réglage | Par défaut | Rôle |
|---|---|---|
| `DOMAIN` | Adresse IP du serveur (réglée par l'installeur) | Le nom de domaine ou l'adresse que les personnes utilisent pour ouvrir l'outil. Séparez plusieurs valeurs par des virgules. L'outil refuse toute autre adresse (erreur 400). |
| `DJANGO_HTTPS` | `0` | À mettre à `1` derrière Caddy ou un autre proxy HTTPS. Cela active les cookies sécurisés, la redirection vers HTTPS et HSTS. |
| `HTTP_PORT` | `8000` | Le port de l'outil. Pour ne l'exposer qu'au proxy, écrivez `127.0.0.1:8000`. |
| `COMPOSE_PROFILES` | Vide | `https` ajoute Caddy. `postgres` ajoute PostgreSQL. Pour les deux, écrivez `https,postgres`. |
| `DATABASE_URL` | Vide (SQLite) | L'adresse de la base PostgreSQL. Voir la section 8. |
| `DJANGO_SECRET_KEY` | Générée | La clé qui chiffre les sessions, signe les sauvegardes et chiffre les secrets enregistrés dans l'outil (mot de passe du serveur d'e-mails, secrets de la copie externe, secret du client de la connexion d'entreprise). Si elle est vide, l'outil la crée au premier démarrage dans `/data/.secret_key`. Si vous la changez, l'outil n'accepte plus les sauvegardes faites avant dans **Administration › Paramètres › Hébergement** : restaurez-les en ligne de commande avec `--unsigned`. Les secrets enregistrés dans l'outil sont alors à saisir de nouveau. |
| `DJANGO_HSTS_SECONDS`, `DJANGO_HSTS_SUBDOMAINS`, `DJANGO_HSTS_PRELOAD` | 1 an, `1`, `0` | Les réglages HSTS. Ils s'appliquent quand `DJANGO_HTTPS=1`. |
| `CONTENT_SECURITY_POLICY_MODE` | `enforce` | La politique de sécurité des contenus des pages. `enforce` bloque ce que la politique ne permet pas. `report-only` ne bloque rien : le navigateur signale seulement, dans sa console, ce qu'il bloquerait. Voir « Sécurité, déjà active » plus bas. |
| `SMTP_…` | Vide | E-mails. Quand `SMTP_HOST` est rempli, ces réglages passent avant les réglages des e-mails saisis dans l'outil. Voir la section 7. |
| `DEFAULT_LANGUAGE` | `en` | La langue d'une nouvelle installation (interface et contenus) : l'une des sept langues de l'interface (`en`, `fr`, `es`, `de`, `it`, `nl`, `pt`). L'outil ne la lit qu'à la création de la base. Ensuite, changez-la dans **Administration › Paramètres › Langues**. Pour une installation en français, mettez `fr` avant le premier démarrage. |
| `GUIDED_TOUR` | `on` | `off` retire la courte visite guidée que les personnes voient à leur première connexion. La visite ne change que l'affichage. |
| `MAX_EVIDENCE_SIZE_MB`, `MAX_IMPORT_SIZE_MB` | `5`, `10` | La taille maximale, en Mo, d'une preuve et d'un fichier d'import. |
| `MAX_BACKUP_UPLOAD_MB` | `2048` | La taille maximale, en Mo, d'une sauvegarde déposée dans l'outil par un administrateur (**Hébergement** › **Restaurer**). L'outil refuse toute autre requête plus grosse que la plus grande des tailles `MAX_EVIDENCE_SIZE_MB` et `MAX_IMPORT_SIZE_MB` (plus 1 Mo), avant de la recevoir. Avec le proxy HTTPS, `CADDY_MAX_SIZE` (50 Mo par défaut) s'applique aussi : augmentez-le pour déposer une sauvegarde plus grosse. |
| `MAX_XLSX_UNCOMPRESSED_MB` | 20 × `MAX_IMPORT_SIZE_MB` | La taille maximale, en Mo, d'un fichier Excel une fois décompressé. L'outil refuse un fichier plus gros avant de l'ouvrir. Un texte de cellule de plus de 32 767 caractères (la limite d'Excel) est aussi refusé. Les mêmes limites s'appliquent aux commandes d'import lancées sur le serveur (`import_kpi`, `import_organisations`, `import_valeurs`) : pour importer un fichier plus gros par une commande, augmentez `MAX_XLSX_UNCOMPRESSED_MB` le temps de cette commande. |
| `BACKGROUND_IMPORT_ROWS` | `5000` | Un import de valeurs (**Import / Export › Importer des valeurs**) de plus de lignes que ce nombre se fait en arrière-plan. La personne voit une barre d'avancement, et peut quitter la page et revenir. Le processus `run_imports --schedule` fait ces imports. L'image le lance d'elle-même : vous n'installez rien. `0` veut dire jamais : tout import se fait dans la page, qui ne peut durer que 120 s. |
| `DISK_ALERT_MB` | `100` | Quand la place libre sur le disque des données passe sous cette valeur, en Mo, `/sante/` répond `503` (« disk almost full »). |
| `BACKUP_AUTO`, `BACKUP_TIME`, `BACKUPS_KEEP` | `1`, `02:30`, `14` | Valeurs de départ seulement. Ensuite, ces valeurs se règlent dans l'outil, dans **Administration › Paramètres › Hébergement** : sauvegarde automatique activée ou non, fréquence (6 h, 12 h, jour, semaine), heure et nombre de sauvegardes gardées. |
| `TIME_ZONE` | `Europe/Brussels` | Le fuseau horaire de l'installation, sous la forme d'un nom de la liste IANA, par exemple `Europe/Paris` ou `America/New_York`. L'heure des relances automatiques, de la sauvegarde automatique et du contrôle de chaque nuit, « aujourd'hui », et les dates des exports et du journal suivent ce fuseau. **Administration › Paramètres › Hébergement** l'affiche à côté de l'heure du serveur. Si le nom est inconnu, l'outil ne démarre pas et le journal montre l'erreur. |
| `DATA_CHECK_TIME` | `03:30` | L'heure du contrôle et du ménage de chaque nuit. Le contrôle lit la base et ne modifie rien. Le ménage efface les sessions terminées et les éléments supprimés depuis plus longtemps que le délai de la corbeille. Voir la section 9. |
| `GUNICORN_WORKERS`, `GUNICORN_THREADS` | 1 processus par processeur (de 2 à 4), `4` | Capacité du serveur. Un processus utilise 1 processeur à la fois et environ 170 Mo de mémoire. La valeur par défaut convient à un serveur de 2 à 4 processeurs. Voir « Capacité » à la section 8. |
| `GUNICORN_TIMEOUT`, `GUNICORN_KEEPALIVE` | `120`, `75` | La durée maximale d'une requête, en secondes, et la durée pendant laquelle une connexion inutilisée reste ouverte. Gardez `GUNICORN_KEEPALIVE` au-dessus du délai du proxy placé devant l'outil. Le Caddy fourni ferme les connexions inutilisées après 60 s. Si la valeur est plus basse, un enregistrement peut de temps en temps échouer avec l'erreur 502. |
| `DJANGO_LOG_LEVEL` | `INFO` | Le niveau de détail du journal (`INFO`, `WARNING`, `ERROR`). |
| `IMAGE` | Vide (image construite sur le serveur) | L'image publiée à utiliser, par exemple `ghcr.io/probant-reporting/probant:latest`. |
| `HTTPS_CERTIFICATE` | Vide (certificat automatique) | `files` : Caddy sert le certificat de votre entreprise, depuis `certificates/https/`, et ne contacte jamais Let's Encrypt. `./install.sh --cert --key` le règle. Voir « Réseau d'entreprise » en section 2. |
| `PUBLIC_URL` | Vide | L'adresse de l'outil, par exemple `https://reporting.example.com`, dans les e-mails (relances, alertes par e-mail) et dans l'adresse de retour (redirect URI) de la connexion d'entreprise. Vide : les e-mails prennent la première valeur de `DOMAIN`, et la connexion d'entreprise l'adresse de la page. |
| `COMPANY_SIGN_IN`, `COMPANY_SIGN_IN_TIMEOUT` | `on`, `5` | `off` coupe la connexion d'entreprise pour toute l'installation, quel que soit le réglage des gestionnaires des espaces : le bouton disparaît et chacun peut utiliser son mot de passe. Le délai est l'attente la plus longue, en secondes, de chaque appel au fournisseur d'identité. Voir « Connexion avec le compte d'entreprise » plus bas. |
| `EXTRA_CA_CERTS` | `/etc/probant/ca` dans l'image | Sans Docker seulement : le fichier ou le dossier des autorités de certification de votre entreprise, pour les connexions sortantes. Séparez-en plusieurs par `:`. Avec Docker, mettez les fichiers dans `certificates/ca/` (`./install.sh --ca-cert`). Voir « Réseau d'entreprise » en section 2. |

## Sécurité, déjà active

Sans réglage particulier, l'outil applique ces protections :

- Le mode de débogage est désactivé.
- Le serveur est gunicorn. Il tourne sans droits root (utilisateur 1000).
- Le code de l'outil dans l'image (`/app`) appartient à root : l'outil peut le lire mais pas le modifier. L'outil
  n'écrit que dans le dossier des données (`/data`). Les fichiers et dossiers qui s'y trouvent ne sont lisibles que par
  l'outil (`0600` et `0700`).
- Les archives d'un espace ne contiennent aucune empreinte de mot de passe, et l'outil signe chaque archive. La page
  **Hébergement** ne restaure que les archives de cette installation, intactes.
- WhiteNoise sert les fichiers statiques, avec un cache navigateur.
- L'outil envoie les pages compressées.
- L'outil envoie les en-têtes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` et
  `Referrer-Policy: same-origin`.
- Chaque page a une politique de sécurité des contenus (en-tête `Content-Security-Policy`). Le navigateur n'exécute
  que les scripts et les styles de l'outil. Un script ou un style venu d'ailleurs ne s'exécute pas, même si quelqu'un
  le glisse dans un texte. La page ne charge rien depuis un autre site, et aucun autre site ne peut l'afficher dans un
  cadre. Les preuves et le logo gardent leur propre politique, plus stricte.
- Une session expire au bout de 12 heures.
- L'outil sert les preuves seulement après avoir contrôlé les droits. Il n'y a jamais d'accès direct.
- Après 5 échecs de connexion pour un même identifiant depuis une même adresse, l'outil refuse la connexion pendant
  15 minutes. Il fait de même après 50 échecs depuis une même adresse (tous identifiants confondus), et après 20 échecs
  sur un même compte depuis toutes les adresses (la même personne dans tous les espaces ; un identifiant inconnu est
  compté de la même façon, pour que le message ne dise pas si le compte existe). Le message est le même pour chaque
  limite. La limite vaut pour la page de connexion de l'outil et pour le mode expert (`/admin/`). Elle ne ferme jamais
  une session déjà ouverte et n'arrête pas les jetons des assistants IA (MCP), qui n'utilisent pas le mot de passe.
  Contrepartie connue et acceptée : quelqu'un qui connaît l'identifiant d'une personne peut bloquer exprès sa
  connexion par mot de passe pendant 15 minutes. Le journal du serveur a une ligne à chaque blocage.
- Dans **Mon compte**, après 5 mots de passe actuels faux, l'outil ne vérifie plus le mot de passe actuel pendant
  15 minutes, même le bon, et le dit. La session reste ouverte. Ce compte est par personne, distinct de la connexion.
  Tous les processus du serveur partagent ces comptes, qui restent après un redémarrage : l'outil les garde dans le
  dossier `sign-in-attempts/` du dossier des données. Rien à régler.
- L'outil lit l'adresse du visiteur dans `X-Forwarded-For` seulement quand `DJANGO_HTTPS=1`. Caddy ou l'autre proxy
  HTTPS doit ajouter cet en-tête.

En HTTPS, `python manage.py check --deploy` ne signale aucun avertissement.

Si un écran ne fonctionne plus après une mise à jour (un bouton ne fait rien, une page n'a plus de couleurs), la
politique de sécurité des contenus peut en être la cause. Pour le savoir :

1. Dans le fichier `.env`, mettez `CONTENT_SECURITY_POLICY_MODE=report-only`.
2. Redémarrez l'outil : `docker compose up -d`.
3. Rouvrez l'écran. S'il fonctionne maintenant, ouvrez la console du navigateur (F12) : chaque ligne qui commence par
   `[Report Only]` nomme ce que la politique bloquerait. Envoyez ces lignes avec la version de l'outil.
4. Quand une version corrigée est installée, retirez la ligne ou mettez `CONTENT_SECURITY_POLICY_MODE=enforce`, puis
   redémarrez.

Avec `report-only`, la protection est coupée : ne gardez cette valeur que le temps de la vérification.

## Assistants IA (MCP) : rien à faire

L'outil contient un serveur pour les assistants IA (Model Context Protocol), à l'adresse `/mcp/` de chaque espace
(`/espace/<code>/mcp/` pour un autre espace). Il tourne dans le même conteneur, sur le même port, derrière le même
HTTPS : aucun service, aucun port, aucune variable, rien à installer. Il reste éteint tant qu'un administrateur ne l'a
pas permis dans **Administration › Paramètres › Assistants**. Seule condition : le proxy transmet l'en-tête
`Authorization` à l'outil (Caddy, profil `https`, et Clever Cloud le font sans réglage). Les jetons des assistants ne
sont jamais dans les sauvegardes. Le journal de l'outil montre les jetons refusés (`serveur_mcp: MCP: token refused`).
Détails : `assistants_mcp.md`, section 7.

## Connexion avec le compte d'entreprise

Chacun peut se connecter avec son compte d'entreprise (connexion unique, OpenID Connect). Elle est éteinte par défaut. Un gestionnaire des espaces la règle dans **Administration › Paramètres › Connexion d'entreprise**. Ce que fait l'IT :

| Élément | Valeur |
|---|---|
| Réseau | Autorisez les connexions HTTPS sortantes (TCP 443) du serveur vers le fournisseur d'identité. Rien n'entre. |
| Adresse | Réglez `PUBLIC_URL` dans `.env` : l'outil en tire l'adresse de retour (redirect URI). |
| Secours | Si aucun gestionnaire des espaces ne peut se connecter, réglez `COMPANY_SIGN_IN=off` dans `.env`, puis lancez `docker compose up -d`. Chacun peut de nouveau utiliser son mot de passe. |

Détails : [Se connecter avec le compte d'entreprise](/docs/single-sign-on/).
