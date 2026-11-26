---
title: "Dossier de sécurité"
description: "Ce document décrit comment Probant protège les données, pour une revue de sécurité avant l'installation. Vous pouvez l'envoyer tel quel à vos équipes…"
order: 0.6
group: "Before you install"
source: "docs/fr/dossier_securite.md"
---

Ce document décrit comment Probant protège les données, pour une revue de sécurité avant l'installation. Vous pouvez
l'envoyer tel quel à vos équipes informatique et sécurité.

Chaque point décrit l'outil tel qu'il est. Quand l'outil ne fait pas quelque chose, le document le dit. Le questionnaire
de la fin donne une réponse courte aux questions habituelles d'une équipe sécurité.

Documents liés :

- [Ce qu'il faut préparer avant d'installer Probant](/docs/it-request/) : la liste pour l'IT
- [Installer Probant](/docs/) : installation, réglages, sauvegardes, mises à jour et supervision
- [Politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md) : comment signaler une faille
- Espaces (en anglais) : plusieurs départements dans une même installation

> Cette copie laisse de côté une fonction facultative, éteinte par défaut, que ce site ne présente pas. Le document complet est `docs/fr/dossier_securite.md` dans le dépôt de l'outil.

## 1. Architecture

Probant est une application web (Python 3.12, Django 5.2, une version à support long). Votre entreprise l'installe sur
son propre serveur avec Docker, ou sur son propre compte chez un hébergeur clé en main. Les personnes qui développent
Probant ne l'hébergent pas et n'y ont aucun accès.

Ce schéma présente une installation Docker avec toutes ses parties :

```text
 Personnes (navigateur web)                 Assistants IA (MCP, facultatif, éteint par défaut)
        |  HTTPS, TCP 443 (TCP 80 pour le certificat et la redirection)
        v
 +----------------------------- Serveur de votre entreprise -----------------------------+
 |  caddy  (facultatif, profil "https") : HTTPS, certificat Let's Encrypt                |
 |     |  HTTP, réseau interne de Docker                                                 |
 |     v                                                                                 |
 |  web  (Probant : gunicorn et Django, utilisateur 1000, port 8000)                     |
 |     |-- volume /data : bases (SQLite), preuves, logo, sauvegardes,                    |
 |     |   clé secrète, compteurs des connexions                                         |
 |     '-- db  (facultatif, profil "postgres") : PostgreSQL 16, réseau interne seulement |
 +---------------------------------------------------------------------------------------+
        |  sortant : serveur SMTP (s'il est réglé), copie externe des sauvegardes (si elle est réglée),
        |  fournisseur d'identité (si la connexion d'entreprise est allumée)
        v

 Minuterie du serveur (facultative, hors des conteneurs) : auto-update.sh, mises à jour automatiques
```

Ce tableau présente les parties de l'installation :

| Partie | Contenu |
|---|---|
| Conteneur `web` | L'outil : serveur web gunicorn, Django, fichiers statiques servis par WhiteNoise. Le même conteneur fait tourner les tâches de fond : sauvegardes automatiques, relances, contrôle des données de la nuit, gros imports et exports. |
| Volume `/data` | Toutes les données de l'outil : bases (avec SQLite), preuves, logo, sauvegardes, clé secrète et compteurs des connexions |
| Conteneur `caddy` (facultatif) | Proxy HTTPS devant l'outil (profil `https`), avec un certificat Let's Encrypt automatique, ou avec le certificat de votre entreprise (`HTTPS_CERTIFICATE=files`) : Caddy ne contacte alors jamais Let's Encrypt |
| Dossier `certificates/` | Le certificat de votre entreprise et sa clé privée (`https/`, lus par Caddy seulement, jamais par l'outil, jamais dans une sauvegarde), et les autorités de certification de votre entreprise pour les connexions sortantes (`ca/`, en lecture seule) |
| Conteneur `db` (facultatif) | PostgreSQL 16 (profil `postgres`). L'outil peut aussi utiliser votre propre serveur PostgreSQL, ou SQLite (par défaut). |
| Minuterie des mises à jour automatiques (facultative) | `auto-update.sh`, lancé par systemd ou cron sur le serveur, hors des conteneurs. Il lit le choix fait dans l'outil dans un fichier du volume des données, et y écrit son résultat. Voir la section 10. |
| Hébergement clé en main (option) | Chez Clever Cloud : une application Python, un add-on PostgreSQL et un FS Bucket pour les fichiers. Clever Cloud fournit HTTPS. Voir [Hébergement clé en main](/docs/managed-hosting/). |

Avec Docker, l'outil tourne dans un seul conteneur `web`, sur un seul serveur. L'outil n'a pas de mode de haute
disponibilité : si le serveur s'arrête, l'outil s'arrête.

Une installation peut servir plusieurs départements, chacun dans son **espace**. Chaque espace a sa propre base. Un
registre commun garde les comptes, la liste des espaces, les accès et les sessions. Voir Espaces.

## 2. Données que l'outil garde

### Données métier

L'outil garde les référentiels, les KPI, les organisations, les campagnes, les valeurs, les commentaires, les
justifications des alertes et les preuves (PDF, JPG ou PNG). Une preuve peut contenir des données personnelles : la
personne qui l'ajoute est responsable de son contenu.

### Données personnelles

Ce tableau présente les données personnelles que l'outil garde, et combien de temps :

| Donnée | Contenu | Durée |
|---|---|---|
| Compte | Nom, adresse e-mail, identifiant, rôle, équipe, langue, date de la dernière connexion. Pour un lecteur ou un auditeur, les organisations qu'il peut voir. | Tant que le compte existe. Un compte jamais utilisé peut être supprimé. Après une première utilisation, il est désactivé à la place, pour que l'historique reste complet. |
| Mot de passe | Seulement son empreinte (PBKDF2 avec SHA-256, le réglage par défaut de Django) | Jusqu'au prochain changement de mot de passe |
| Historique des modifications | Qui a fait chaque modification, quand, et la valeur avant et après | Sans limite : l'outil ne l'efface jamais |
| Historique des connexions | Date, compte, résultat (réussie, manquée, bloquée) et méthode (mot de passe ou compte d'entreprise). Pour une connexion d'entreprise refusée, un motif court. Jamais le mot de passe, jamais un jeton, jamais l'adresse réseau. Pour un identifiant qui ne correspond à aucun compte, seulement une courte référence HMAC, jamais le texte tapé. | 180 jours par défaut, de 1 à 730 jours (**Administration › Paramètres › Hébergement**) |
| Compteurs des connexions | Une empreinte de l'identifiant et de l'adresse réseau, pour bloquer les échecs répétés | 15 minutes après le dernier échec |
| Lien avec un compte d'entreprise | Quand la connexion d'entreprise est allumée : l'identifiant (`sub`) que le fournisseur d'identité donne à la personne, l'adresse du fournisseur, et les dates du lien et de la dernière connexion | Jusqu'à ce qu'un gestionnaire des espaces retire le lien. Une restauration du registre commun retire tous les liens. |
| Sessions | La session de chaque personne connectée, avec ses choix (langue, campagne, organisation affichée) | 12 heures sans activité au plus. Le ménage de la nuit efface les sessions terminées. |
| Relances envoyées | Qui a reçu une relance, qui l'a envoyée, et quand | Tant que le compte de la personne existe |
| Éléments supprimés (corbeille) | Un export enregistré, une liste de KPI ou une vue de la Visualisation qu'une personne a supprimés, avec le nom de la personne | 30 jours par défaut, de 1 à 365 jours |
| Sauvegardes | Une copie de toutes les données ci-dessus, et des preuves | 14 sauvegardes par défaut (nombre et fréquence réglés dans **Administration › Paramètres › Hébergement**) |
| Journal du serveur | Pour chaque requête : l'adresse réseau, la page, le code et la durée. Quand une connexion est bloquée : l'identifiant tapé et l'adresse réseau. | Réglé par l'IT dans Docker. L'outil ne fait pas tourner le journal. |

Chaque personne peut lire la page **Données et confidentialité** de l'outil, même sans être connectée. La page liste
les mêmes données, à partir des réglages réels de l'installation. Un administrateur ajoute la déclaration de
l'entreprise (responsable du traitement, délégué à la protection des données) dans
**Administration › Paramètres › Identité**.

Un administrateur peut corriger le nom, l'adresse e-mail et l'équipe d'une personne. Un administrateur peut supprimer
les preuves des KPI sensibles dans **Administration › Preuves à supprimer**. Les sauvegardes déjà faites gardent ces
fichiers jusqu'à ce que l'outil les remplace.

### Aucune télémétrie

L'outil n'envoie aucune donnée d'utilisation, aucune statistique et aucun rapport d'erreur, ni aux personnes qui le
développent ni à aucun autre service. Il ne cherche pas de lui-même les mises à jour : les mises à jour automatiques sont une tâche du serveur (section 10). Les pages ne chargent rien depuis
un autre site : aucune police, aucun script, aucune mesure d'audience.

## 3. Flux réseau

Ce tableau présente chaque flux entrant :

| Port | Protocole | Quand | Rôle |
|---|---|---|---|
| TCP 443, UDP 443 | HTTPS | Avec le proxy Caddy (profil `https`) | Accès à l'outil. UDP 443 sert à HTTP/3. |
| TCP 80 | HTTP | Avec le proxy Caddy | Validation du certificat Let's Encrypt (pas avec le certificat de votre entreprise), et redirection vers HTTPS |
| TCP 8000 (`HTTP_PORT`) | HTTP | Toujours | Le port de l'outil. Avec le proxy Caddy, il n'est ouvert qu'au serveur lui-même (`127.0.0.1:8000`). Sans proxy, il est ouvert sur toutes les adresses du serveur, sans chiffrement. |
| TCP 5432 | PostgreSQL | Avec le profil `postgres` | Non publié. Seul le conteneur `web` l'atteint, sur le réseau interne de Docker. |

Le serveur pour les assistants IA (MCP) n'ajoute aucun port : il est à l'adresse `/mcp/` de chaque espace, sur le même
port et derrière le même HTTPS. Il reste éteint tant qu'un administrateur ne l'allume pas dans
**Administration › Paramètres › Assistants**.

Ce tableau présente chaque flux sortant :

| Destination | Port | Quand | Rôle |
|---|---|---|---|
| Votre serveur SMTP | `SMTP_PORT` (587 par défaut, 465 avec `ssl`) | Seulement si un serveur d'e-mails est réglé (dans **Paramètres › Hébergement**, ou `SMTP_HOST`) | Relances, alertes par e-mail de la santé de l'installation et e-mail de test |
| Votre destination de la copie externe des sauvegardes : stockage compatible S3, ou serveur SFTP | Le port de l'adresse (443 par défaut en https), ou le port SFTP (22 par défaut) | Seulement si un administrateur règle une destination dans **Paramètres › Hébergement › Copie externe** | Copie de chaque nouvelle sauvegarde et de la sauvegarde du registre commun, quelques secondes après sa création ; fichier d'essai quand l'administrateur essaie la destination ; suppression des anciennes copies seulement si l'administrateur le demande. L'adresse est celle que saisit l'administrateur : jamais le serveur lui-même, une adresse locale au lien (métadonnées de l'hébergeur) ni une adresse réservée. Les adresses internes (NAS, MinIO) sont acceptées. Avec `HTTPS_PROXY`, un service S3 public est joint par le proxy. SFTP demande une connexion directe. |
| Let's Encrypt | TCP 443 | Avec le proxy Caddy et le certificat automatique seulement | Obtenir et renouveler le certificat. Jamais avec le certificat de votre entreprise. |
| Votre fournisseur d'identité (OpenID Connect) | TCP 443 | Seulement quand la connexion d'entreprise est réglée : quand une personne clique sur le bouton, quand le fournisseur la renvoie vers l'outil, et quand un gestionnaire des espaces vérifie ou enregistre le réglage | Réglages et clés de signature du fournisseur, et échange du code contre le jeton d'identité. HTTPS seulement, aucune redirection suivie, JSON de 1 Mo au plus, 5 secondes au plus pour chaque appel (`COMPANY_SIGN_IN_TIMEOUT`). Jamais le serveur lui-même, une adresse lien-local (métadonnées d'un cloud) ni une adresse réservée. |
| Votre serveur PostgreSQL | Le port de `DATABASE_URL` | Seulement si `DATABASE_URL` désigne un serveur externe | Base de données |
| `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, `ghcr.io`, `pkg-containers.githubusercontent.com`, `tuf-repo-cdn.sigstore.dev` | TCP 443 | Depuis le serveur, seulement pendant l'installation et les mises à jour | Récupérer les fichiers de la version et la liste signée de leurs empreintes, l'image publiée et le conteneur de cosign. Vérifier les signatures (racine de confiance de Sigstore). |
| Docker Hub, PyPI | TCP 443 | Depuis le serveur, seulement quand le serveur construit l'image (installation avec Git) | Images de base et paquets Python |

Il n'y a aucun autre flux. Connexion
d'entreprise éteinte, il n'ouvre aucune connexion vers un fournisseur d'identité. Avec le paquet hors ligne
(`./install.sh --offline`, `./update.sh --offline`), l'installation et les mises à jour ne téléchargent rien.

Avec les mises à jour automatiques (section 10), le serveur lui-même, pas le conteneur de l'outil, ouvre chaque nuit
ces flux sortants :

| Destination | Port | Quand | Rôle |
|---|---|---|---|
| `github.com`, `raw.githubusercontent.com` | TCP 443 | Chaque nuit, si la minuterie est posée | Trouver la dernière version publiée et télécharger ses fichiers |
| `objects.githubusercontent.com`, `release-assets.githubusercontent.com` | TCP 443 | Quand il y a une nouvelle version à installer | Télécharger la liste des empreintes SHA-256 de ses fichiers, jointe à sa release |
| `ghcr.io`, `pkg-containers.githubusercontent.com` | TCP 443 | Chaque nuit, si le choix n'est pas « Éteint » | Télécharger la nouvelle image, et le conteneur officiel de cosign |
| `tuf-repo-cdn.sigstore.dev` | TCP 443 | Quand il y a une nouvelle image | Racine de confiance de Sigstore, pour vérifier la signature de l'image |

## 4. Authentification et sessions

- **Mot de passe.** Chaque personne se connecte avec son adresse e-mail ou son identifiant, et un mot de passe. Les
  administrateurs créent les comptes dans l'outil.
- **Connexion d'entreprise (authentification unique, SSO).** OpenID Connect, avec tout fournisseur standard (par
  exemple Microsoft Entra ID, Google, Okta ou Keycloak). Elle est éteinte par défaut. Un gestionnaire des espaces la
  règle pour toute l'installation, dans **Administration › Paramètres › Connexion d'entreprise**. Voir
  [Connexion d'entreprise](/docs/single-sign-on/).
  - Le fournisseur prouve seulement qui est la personne. L'outil trouve le compte par l'adresse e-mail, que le
    fournisseur doit déclarer vérifiée. L'outil ne crée aucun compte et ne prend aucun rôle chez le fournisseur.
  - Flux : code d'autorisation avec PKCE (`S256`), un `state` à usage unique (10 minutes) et un `nonce`. Seulement des
    signatures asymétriques du jeton d'identité (algorithmes RS, PS et ES), vérifiées avec les clés publiées du
    fournisseur. `iss`, `aud`, `exp` et `iat` sont vérifiés.
  - Quand elle est allumée, seuls les gestionnaires des espaces gardent leur mot de passe, comme comptes de secours,
    sauf si un gestionnaire des espaces permet le mot de passe à tous. Une personne que l'entreprise bloque chez le
    fournisseur ne peut alors plus se connecter.
  - Quand la connexion d'entreprise est allumée, une session ouverte par mot de passe suit la même règle qu'une
    nouvelle connexion.
  - Après 30 connexions d'entreprise refusées en 15 minutes depuis une même adresse réseau, le bouton est refusé depuis
    cette adresse pendant 15 minutes.
  - L'IT peut la couper pour toute l'installation (`COMPANY_SIGN_IN=off`) : chacun peut de nouveau utiliser son mot de
    passe.
  - L'outil ne gère ni SAML ni LDAP. Il ne joint Active Directory qu'à travers un fournisseur OpenID Connect.
- **Authentification à plusieurs facteurs.** L'outil n'en a pas à lui. Avec la connexion d'entreprise, le fournisseur
  d'identité applique la sienne. Une connexion par mot de passe n'a pas de second facteur.
- **Règles des mots de passe.** Un mot de passe a au moins 8 caractères, n'est pas trop proche du nom, de
  l'identifiant ou de l'adresse e-mail, n'est pas un mot de passe courant et n'est pas fait que de chiffres. Ces règles
  sont fixes. Les mots de passe n'expirent pas.
- **Mot de passe provisoire.** Un administrateur donne à un nouveau compte un mot de passe provisoire tiré au hasard.
  Tant que la personne ne l'a pas changé, l'outil n'ouvre que **Mon compte**.
- **Blocage des échecs répétés.** L'outil refuse la connexion pendant 15 minutes après l'une de ces limites :
  - 5 échecs pour un même identifiant depuis une même adresse réseau
  - 50 échecs depuis une même adresse réseau, tous identifiants confondus
  - 20 échecs sur un même compte, depuis toutes les adresses
- Toute connexion par mot de passe manquée donne le même message, quelle qu'en soit la cause. Il ne dit pas si le
  compte existe. Les limites valent aussi pour le mode expert (`/admin/`). Tous les processus du serveur partagent les compteurs, qui restent après un redémarrage.
  Contrepartie connue et acceptée : quelqu'un qui connaît un identifiant peut bloquer la connexion par mot de passe de
  ce compte pendant 15 minutes.
- **Changement de mot de passe.** Dans **Mon compte**, la personne saisit son mot de passe actuel. Après 5 mots de
  passe actuels faux, l'outil ne le vérifie plus pendant 15 minutes.
- **Sessions.** Le serveur garde les sessions dans le registre commun. Le cookie de session est `HttpOnly`,
  `SameSite=Lax`, et `Secure` en HTTPS. Sans activité, une session se termine au bout de 12 heures. Se déconnecter la
  termine aussitôt. Le cookie reste quand le navigateur se ferme.
- **Blocage d'un compte.** Un administrateur désactive un compte dans son espace. Un gestionnaire des espaces peut
  bloquer la connexion d'une personne dans tous les espaces à la fois.
- **Jetons des assistants IA (MCP).** Chaque personne crée ses propres jetons, quand un administrateur a allumé le
  serveur MCP. L'outil ne garde que l'empreinte SHA-256 de chaque jeton. Un jeton expire au bout de 7, 30 ou 90 jours,
  jamais plus que le maximum réglé par l'administrateur (365 jours au plus). Un jeton a les droits de son titulaire,
  relus à chaque requête. Un changement de mot de passe révoque tous les jetons de la personne. Quand la connexion
  d'entreprise est allumée, une personne qui ne peut pas se connecter avec un mot de passe n'a aucun accès par un
  assistant : aucun nouveau jeton, et ceux d'avant sont refusés. Voir
  Assistants IA (MCP).

## 5. Rôles et cloisonnement

Chaque compte a un rôle dans chaque espace. Ce tableau présente les rôles :

| Rôle | Droits |
|---|---|
| Administrateur | Met en place l'espace : comptes, référentiels, organisations, campagnes, paramètres. Lit l'historique. |
| Validateur | Valide les saisies des KPI et des organisations qui lui sont attribués, et des organisations en dessous |
| Contributeur | Saisit les valeurs qui lui sont attribuées, ajoute les preuves et valide sa saisie |
| Lecteur | Lit la Visualisation et le Tableau de bord. Ne modifie jamais rien. |
| Auditeur | Lit tout ce qu'il faut pour un audit : valeurs, preuves, historique, alertes, historique des connexions. Ne modifie jamais rien. |
| Gestionnaire des espaces | Crée et archive les espaces, gère l'accès des personnes à chaque espace, et change les réglages de toute l'installation : connexion d'entreprise, serveur d'e-mails, alertes par e-mail, mises à jour automatiques, copie externe des sauvegardes |

L'administrateur peut limiter un lecteur ou un auditeur à certaines organisations. L'outil refuse toute requête qui
écrit venant d'un lecteur ou d'un auditeur, avant que la page ne s'exécute. Seules exceptions : leurs propres
préférences, comme leur mot de passe ou leurs vues personnelles.

Le mode expert (`/admin/`), pour les administrateurs, montre les tables de la base et ne modifie rien.

L'outil ne sert une preuve qu'après avoir contrôlé les droits de la personne. Il n'y a aucun accès direct aux fichiers.

Les espaces sont séparés :

- Chaque espace a sa propre base et son propre dossier de fichiers.
- L'administrateur d'un espace ne peut pas modifier l'adresse e-mail, le nom ou le mot de passe d'une personne qui
  travaille aussi dans un espace où il n'est pas administrateur.
- Tous les espaces sont à la même adresse web. Une faille de type XSS dans un espace agirait dans les autres espaces
  d'une personne qui y a accès. Aucune faille de ce type n'est connue.
- Un gestionnaire des espaces peut prendre la main sur n'importe quel compte. Ne nommez que des personnes de
  confiance.
- Seul un gestionnaire des espaces peut changer les réglages qui valent pour tous les espaces (serveur d'e-mails,
  copie externe des sauvegardes, alertes par e-mail, mises à jour automatiques). Les autres administrateurs, y compris
  dans l'espace principal, les voient seulement. La copie externe reçoit les archives de tous les espaces et du
  registre commun.

## 6. Chiffrement

Ce tableau présente ce que l'outil chiffre, et ce qu'il ne chiffre pas :

| Élément | Chiffré | Détail |
|---|---|---|
| Du navigateur vers l'outil, avec Caddy ou votre propre proxy HTTPS | Oui | HTTPS. Avec `DJANGO_HTTPS=1` : redirection vers HTTPS, HSTS (1 an avec les sous-domaines par défaut), cookies sécurisés. |
| Du navigateur vers l'outil, sans nom de domaine | Non | HTTP sur le port 8000. À réserver à un réseau interne ou à un essai. |
| De l'outil vers le serveur SMTP | À votre choix | `SMTP_SECURITY` : `starttls` (par défaut), `ssl` ou `none`. Avec TLS, l'outil vérifie le certificat du serveur. |
| De l'outil vers le fournisseur d'identité | Oui | HTTPS seulement, avec vérification du certificat. |
| De l'outil vers la destination de la copie externe | Oui, sauf `http` | S3 : HTTPS avec vérification du certificat ; `http` n'est accepté que pour une adresse du réseau interne. Chaque requête est signée (Signature Version 4) : la clé secrète ne quitte jamais le serveur. SFTP : SSH, avec la clé du serveur épinglée : l'outil montre son empreinte SHA-256 au premier essai, un administrateur la confirme, puis l'outil refuse toute autre clé avant d'envoyer le mot de passe ou la signature. |
| Certificats vérifiés par l'outil | Oui | Chaque connexion sortante vérifie le certificat du serveur avec les autorités du système, et avec les autorités de votre entreprise que l'IT ajoute (`certificates/ca/`, `EXTRA_CA_CERTS`). L'outil ne coupe jamais la vérification. **Administration › Paramètres › Santé** montre les autorités ajoutées et leur date d'expiration. |
| De l'outil vers PostgreSQL | Non réglé par l'outil | L'outil ne règle aucune option TLS pour cette connexion. Avec le profil `postgres`, la connexion reste sur le réseau interne de Docker. |
| Bases, preuves, logo | Non | L'outil ne les chiffre pas. |
| Sauvegardes (archives `.zip`) | Non | L'outil les signe, mais ne les chiffre pas. C'est vrai aussi des copies que l'outil envoie à la destination de la copie externe. |
| Secrets enregistrés dans l'outil : mot de passe du serveur d'e-mails, clé secrète, mot de passe ou clé privée de la copie externe, secret du client de la connexion d'entreprise | Oui | Chiffrés avec des clés tirées de la clé secrète de l'installation : HMAC-SHA256 en mode compteur, puis scellé par HMAC-SHA256 (serveur d'e-mails, copie externe), ou Fernet, c'est-à-dire AES-128-CBC avec HMAC-SHA256, avec une clé tirée par HKDF (connexion d'entreprise). Les secrets du serveur d'e-mails et de la copie externe sont liés à leur champ : un secret recopié dans un autre champ ne se lit pas. L'outil ne les réaffiche jamais et ne les écrit jamais dans l'historique, le journal, le fichier de configuration exporté ni l'archive d'un espace. Sur un autre serveur, ou après un changement de la clé secrète, ils ne se lisent plus : il faut les saisir de nouveau. |
| Clé secrète, fichier `.env` | Non | Lisibles seulement par l'utilisateur de l'outil (fichiers `0600`). `install.sh` rend le fichier `.env` lisible par son seul propriétaire. |
| Certificat et clé privée de votre entreprise pour HTTPS (`certificates/https/`) | Non | Clé en mode `0600`, dans un dossier en mode `0700`, hors du volume des données. Caddy la lit. Le conteneur de l'outil ne la reçoit jamais : aucune sauvegarde ne la contient. |
| Mots de passe, jetons MCP | Empreinte | Une empreinte ne permet pas de retrouver le mot de passe ou le jeton. |

**Le chiffrement au repos relève de l'IT** : chiffrement du disque ou du volume du serveur, ou chiffrement fourni par
l'hébergeur. L'outil protège ses fichiers par les seuls droits du système : il tourne sous l'utilisateur 1000, et crée
ses fichiers en mode `0600` et ses dossiers en mode `0700`.

La clé secrète de l'installation signe les sessions et les sauvegardes. L'outil la crée au premier démarrage, dans
`/data/.secret_key`, sauf si l'IT la donne dans `DJANGO_SECRET_KEY`. La version tout-en-un (Windows, Mac) crée aussi
sa propre clé à son premier démarrage. L'outil n'utilise ni service de gestion des clés ni module matériel de sécurité.

## 7. Sauvegardes et restauration

- **Automatiques.** Par défaut, l'outil fait une sauvegarde chaque jour à 02:30 et en garde 14. Un administrateur règle
  la fréquence (6 heures, 12 heures, jour, semaine), l'heure et le nombre gardé.
- **Contenu.** Toute la base de l'espace, ses preuves et son logo, et un descriptif.
- **Jamais dans une sauvegarde** : les jetons MCP, la clé secrète, les fichiers des gros
  exports, le réglage de la connexion d'entreprise et les liens avec les comptes d'entreprise, et le dossier
  `certificates/`.
- **Mots de passe.** L'archive d'un espace ne contient aucune empreinte de mot de passe. Les sauvegardes du registre
  commun, dans `/data/backups/shared/`, les contiennent. L'outil ne les liste jamais et ne permet à personne de les
  télécharger.
- **Signature.** L'outil signe chaque archive en HMAC-SHA256, avec une clé dérivée de la clé secrète. La page
  **Administration › Paramètres › Hébergement** ne restaure que les archives de cette installation, intactes. L'IT peut
  restaurer une autre archive en ligne de commande, avec l'option `--unsigned`.
- **Restauration sûre.** Une restauration sauvegarde d'abord l'état actuel. Si une restauration s'arrête en cours de
  route, l'outil la termine au démarrage suivant. Une restauration supprime tous les jetons MCP de l'espace.
- **Mises à jour.** `./update.sh` sauvegarde chaque espace avant de rien changer.
- **Copie externe.** L'IT copie `/data/backups` hors du serveur, à intervalle régulier. Ou un administrateur règle une
  destination dans **Paramètres › Hébergement › Copie externe** (stockage compatible S3 ou serveur SFTP) : l'outil copie
  alors chaque nouvelle archive de chaque espace et du registre commun, et rattrape après un échec. Les copies
  contiennent les empreintes des mots de passe et les secrets chiffrés : la destination doit être privée, et seule l'IT
  doit pouvoir l'ouvrir. Par défaut, l'outil ne supprime rien à la destination. Si l'administrateur règle un nombre de
  copies à garder, l'outil ne supprime que les archives plus anciennes qu'il a faites lui-même (dossier et nom qu'il
  reconnaît). Un échec de la copie part en alerte par e-mail (si les alertes sont allumées) et se lit dans
  **Paramètres › Santé** et dans `/sante/` (`external_copy`).

## 8. Journaux et traçabilité

| Trace | Contenu | Qui la lit |
|---|---|---|
| Historique des modifications | Chaque modification des valeurs, validations, preuves, campagnes, référentiels, organisations, comptes et paramètres : qui, quand, avant et après. L'outil ne l'efface jamais. Les modifications faites par un assistant IA portent « (via MCP) ». | Administrateurs et auditeurs, avec un export Excel |
| Historique des connexions | Voir la section 2. Chaque ligne donne la méthode : mot de passe ou compte d'entreprise. | Administrateurs et auditeurs de l'espace. Chaque personne voit ses dernières connexions dans **Mon compte**. |
| Restaurations | Quand, quelle sauvegarde et qui l'a faite. Gardées hors de la base. | Administrateurs et IT |
| Journal du serveur | Démarrage, chaque requête, sauvegardes, erreurs, connexions bloquées, jetons MCP refusés. Toujours en anglais, sur la sortie standard du conteneur (`docker compose logs web`). | IT |

Un auditeur limité à certaines organisations ne voit que les lignes sur les valeurs de ces organisations.

L'outil peut envoyer des alertes par e-mail sur la santé de l'installation (sauvegarde échouée ou en retard, disque
presque plein, tâche de fond arrêtée, e-mails en échec, copie externe en échec, mises à jour automatiques…). Elles
sont allumées dès le départ sur une installation neuve. Sur une installation qui existait avant elles, elles restent
éteintes tant qu'un gestionnaire des espaces ne les allume pas dans **Paramètres › Santé**. L'e-mail dit ce qui se passe et quoi
faire : aucune donnée, aucun dossier du disque. Les changements de ce réglage et les alertes d'essai sont dans
l'historique des modifications.

L'outil n'a pas de connecteur vers un SIEM. Pour collecter le journal du serveur, utilisez le pilote de journaux de
Docker.

## 9. Protections du navigateur

L'outil envoie ces en-têtes :

| En-tête | Valeur |
|---|---|
| `Content-Security-Policy` | Scripts et styles de l'outil seulement, chaque script ou style intégré avec un jeton tiré au hasard à chaque requête. Pas de `unsafe-eval`. Rien ne se charge depuis un autre site. Aucun cadre, aucun objet. `frame-ancestors 'none'`. Les attributs de style sont permis (`style-src-attr 'unsafe-inline'`). |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `same-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Strict-Transport-Security` | Avec `DJANGO_HTTPS=1` : 1 an, avec les sous-domaines, par défaut |

Autres protections :

- Chaque formulaire porte un jeton CSRF (Django).
- L'outil refuse une requête pour une adresse qui n'est pas dans `DOMAIN` (erreur 400).
- L'outil affiche les textes des personnes échappés. Les textes en Markdown sont rendus sans HTML, et un lien n'accepte
  que les adresses `http`, `https` ou `mailto`.
- Les preuves et le logo ont leur propre politique, plus stricte : aucun script ne s'exécute, même dans un fichier qui
  cache un contenu actif.
- Une preuve doit être un PDF, un JPG ou un PNG, avec un contenu qui correspond à son extension, et 5 Mo au plus par
  défaut. **L'outil ne recherche pas de logiciel malveillant dans les fichiers.**
- L'outil refuse une requête trop grosse avant de la lire, et un fichier Excel trop gros une fois décompressé avant de
  l'ouvrir.
- `CONTENT_SECURITY_POLICY_MODE=report-only` désactive le blocage de la politique, pour trouver la cause d'un écran
  cassé. À n'utiliser que le temps de la vérification.
- En HTTPS, `python manage.py check --deploy` ne signale aucun avertissement.

## 10. Dépendances et mises à jour

- **Versions figées.** `requirements.txt` donne la version exacte de chaque paquet Python de l'image. Deux
  installations faites à des mois d'écart font tourner le même logiciel.
- **Failles connues.** `pip-audit` contrôle ces paquets sur GitHub à chaque modification de la branche principale et à
  chaque demande de fusion. Le contrôle informe, il ne bloque pas.
- **Django** reste sur une version à support long.
- **Bibliothèques de chiffrement.** La connexion d'entreprise utilise PyJWT et cryptography. La copie vers un serveur
  SFTP utilise paramiko (avec bcrypt et PyNaCl). La copie vers S3 et le chiffrement du mot de passe des e-mails
  n'utilisent que la bibliothèque standard de Python. La version tout-en-un n'a aucun de ces paquets, ni la connexion
  d'entreprise ni la copie externe. Les licences sont dans Bibliothèques tierces.
- **Image signée.** Chaque image publiée, depuis la version 1.1.0, est signée avec cosign, sans clé. Le certificat
  nomme le workflow `image.yml` du dépôt public et l'étiquette de la version. Le SBOM (SPDX JSON) est joint à l'image
  comme attestation signée. La release porte le SBOM et un rapport des failles connues (Grype). Voir
  [Vérifier l'image](/docs/install-the-tool/#vérifier-limage).
- **Paquet hors ligne.** Pour un serveur sans accès à Internet, la release porte un paquet signé : l'image de l'outil,
  l'image de Caddy et les fichiers, avec leurs empreintes SHA-256. L'installeur contrôle chaque fichier avant tout
  changement. Voir [Installer sans accès à Internet](/docs/install-the-tool/#installer-sans-accès-à-internet).
- **Corrections.** Une correction de sécurité est une nouvelle version de l'outil. L'IT l'applique avec `./update.sh`,
  qui sauvegarde d'abord les données, ou les mises à jour automatiques l'appliquent. Seule la dernière version reçoit
  les corrections de sécurité. Les changements de chaque version sont dans `CHANGELOG.md`.
- **Mises à jour automatiques.** Après une installation en une commande, une minuterie du serveur (`auto-update.sh`,
  posée par `./install.sh --auto-update on`, retirée par `--auto-update off`) installe chaque nouvelle version la nuit,
  3 jours après sa publication par défaut. Les administrateurs choisissent « automatique », « prévenir seulement » ou
  « éteint ». Le script compare des empreintes d'image, jamais des numéros de version. Il n'installe qu'une image dont
  il a vérifié la signature avec cosign (conteneur officiel épinglé par son empreinte) : l'identité du workflow
  `image.yml` du dépôt public pour l'étiquette de la version, et l'émetteur OIDC de GitHub. Sans signature vérifiée :
  rien n'est installé. La minuterie tourne sur le serveur, hors des conteneurs. Il sauvegarde d'abord chaque espace, et revient à l'image et aux fichiers d'avant si la
  nouvelle version ne répond pas, avec la restauration de la sauvegarde « before-update » de chaque base qui a changé.
  Une version qui change le registre commun des comptes n'est jamais installée automatiquement. Le conteneur de
  l'outil n'atteint jamais Docker ni Internet : il lit seulement le résultat de la tâche dans un fichier du volume des
  données, au format strict. Voir [Mises à jour automatiques](/docs/update-the-tool/#mises-à-jour-automatiques).
- **Fichiers de l'installation.** La release de chaque version porte la liste des empreintes SHA-256 des fichiers que
  l'installeur et les mises à jour téléchargent, signée par le même workflow que l'image. `get.sh`, `update.sh` et
  `auto-update.sh` contrôlent chaque fichier avec elle avant d'en mettre un seul en place, et vérifient la signature
  de la liste (toujours dans `auto-update.sh`, quand cosign ou Docker est sur le serveur pour les deux autres). Pas de
  liste, ou un seul fichier qui ne correspond pas : rien ne change. Voir
  [Installer en une commande](/docs/install-the-tool/#installer-en-une-commande).
- **Signaler une faille** en privé sur GitHub, comme l'explique la [Politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md). Les mainteneurs
  confirment la réception en 7 jours au plus, et donnent leur analyse en 30 jours au plus.

## 11. Partage des responsabilités

Ce tableau présente qui est responsable de chaque partie :

| Partie | IT de l'entreprise | Administrateurs de l'outil | Mainteneurs de Probant |
|---|---|---|---|
| Serveur, système d'exploitation, Docker, mises à jour de sécurité du système | Oui | | |
| Réseau, pare-feu, nom de domaine, certificat HTTPS (ou votre proxy) | Oui | | |
| Chiffrement du disque | Oui | | |
| Compte SMTP | Oui | | |
| Fournisseur d'identité de la connexion d'entreprise : application, personnes autorisées, authentification à plusieurs facteurs, blocage d'une personne | Oui | Oui (réglage dans l'outil) | |
| Certificat de votre entreprise pour HTTPS, et autorités de certification de votre entreprise (`./install.sh --cert --key`, `--ca-cert`) | Oui | | |
| Vérification de la signature de l'image ou du paquet hors ligne avant une installation à la main | Oui | | |
| Copie externe des sauvegardes : destination et son compte, durée de conservation des copies | Oui | Oui (destination réglée dans l'outil) | |
| Rotation et conservation du journal du serveur | Oui | | |
| Supervision de `/sante/`, en plus des alertes par e-mail de l'outil (elle prévient aussi quand le serveur est éteint) | Oui | | |
| Alertes par e-mail de la santé de l'installation : allumage, destinataires | | Oui | |
| Application des mises à jour (`./update.sh`), ou minuterie des mises à jour automatiques (`./install.sh --auto-update`) | Oui | | |
| Choix des mises à jour automatiques : automatique, prévenir seulement, éteint, attente après la publication | | Oui | |
| Comptes, rôles et accès aux espaces | | Oui | |
| Paramètres : sauvegardes gardées, historique des connexions, corbeille, serveur MCP | | Oui | |
| Déclaration de l'entreprise sur la page **Données et confidentialité** | | Oui | |
| Code de l'outil et corrections de sécurité | | | Oui |
| Réponses aux signalements de failles ([Politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md)) | | | Oui |

Les mainteneurs n'ont accès à aucune installation et n'en reçoivent aucune donnée.

## 12. Questionnaire de sécurité

Ce tableau donne une réponse courte aux questions habituelles d'une revue de sécurité :

| N° | Question | Réponse |
|---|---|---|
| 1 | L'outil est-il certifié ISO 27001, SOC 2 ou équivalent ? | Non. |
| 2 | Un tiers a-t-il fait un test d'intrusion ? | Non. |
| 3 | Existe-t-il un programme de prime aux failles (bug bounty) ? | Non. |
| 4 | Existe-t-il une procédure pour signaler une faille ? | Oui. Un signalement privé sur GitHub, voir la [Politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md). |
| 5 | Le code source est-il disponible ? | Oui. Le code est libre, sous licence AGPL-3.0-or-later. |
| 6 | Existe-t-il un contrat avec un niveau de service (SLA) ? | Le projet libre n'en fournit pas. La [Politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md) donne les délais visés pour un signalement de faille. |
| 7 | Qui exploite l'outil ? | Votre équipe informatique, sur votre serveur ou sur votre compte chez un hébergeur |
| 8 | Où sont les données ? | Sur le serveur ou le compte d'hébergement que vous choisissez |
| 9 | L'outil envoie-t-il des données aux mainteneurs ou à d'autres services ? | Non. Seulement à votre serveur SMTP, à la destination de la copie externe des sauvegardes si elle est réglée, et à votre fournisseur d'identité si la connexion d'entreprise est allumée. |
| 10 | Y a-t-il de la télémétrie, de la mesure d'audience ou des contenus venus d'un autre site ? | Non. |
| 11 | Les données d'autres clients sont-elles dans la même installation ? | Non. Chaque entreprise a sa propre installation. |
| 12 | Authentification unique (SAML, OpenID Connect), LDAP ou Active Directory ? | Oui, OpenID Connect, éteinte par défaut, sans création automatique de compte. Ni SAML ni LDAP. Active Directory seulement à travers un fournisseur OpenID Connect (section 4). |
| 13 | Authentification à plusieurs facteurs ? | Pas dans l'outil. Avec la connexion d'entreprise, par le fournisseur d'identité. Une connexion par mot de passe, par exemple d'un compte de secours, n'a pas de second facteur. |
| 14 | Les règles des mots de passe sont-elles réglables ? | Non. Les règles sont fixes : 8 caractères au moins, pas proche du compte, pas courant, pas fait que de chiffres. |
| 15 | Les mots de passe expirent-ils ? | Non. |
| 16 | Y a-t-il un blocage après des échecs de connexion ? | Oui. 15 minutes, après 5, 20 ou 50 échecs (section 4). |
| 17 | Les sessions se terminent-elles toutes seules ? | Oui. Au bout de 12 heures sans activité. Cette durée est fixe. |
| 18 | L'accès est-il géré par rôles ? | Oui. 5 rôles dans chaque espace, et les gestionnaires des espaces (section 5). |
| 19 | Création automatique des comptes (SCIM) ? | Non. Les administrateurs créent et désactivent les comptes dans l'outil, un par un ou plusieurs à la fois. La connexion d'entreprise ne crée aucun compte. |
| 20 | Existe-t-il une trace des connexions ? | Oui. L'historique des connexions, 180 jours par défaut, avec la méthode de chaque connexion. |
| 21 | Existe-t-il une API ? | Oui. Le serveur MCP pour les assistants IA, éteint par défaut, avec des jetons personnels qui expirent. |
| 22 | Chiffrement en transit ? | Oui, avec HTTPS (Caddy, avec un certificat Let's Encrypt ou le certificat de votre entreprise, ou votre proxy) et HSTS. Sans nom de domaine, l'outil utilise HTTP. |
| 23 | Chiffrement au repos ? | Pas par l'outil. Utilisez le chiffrement du disque ou celui de l'hébergeur. |
| 24 | Gestion des clés (KMS, HSM) ? | Non. Une clé secrète, dans un fichier du volume des données ou dans un réglage. |
| 25 | Quelles données personnelles l'outil garde-t-il ? | Nom, adresse e-mail, identifiant, rôle, équipe, langue, dates de connexion, et l'historique des modifications (section 2) |
| 26 | La durée de conservation des données est-elle réglable ? | En partie : historique des connexions, corbeille, nombre de sauvegardes et preuves des KPI sensibles. L'historique des modifications n'est jamais effacé. |
| 27 | Une personne peut-elle demander la suppression de ses données ? | Un administrateur corrige le nom, l'adresse e-mail et l'équipe. Un compte utilisé est désactivé, pas supprimé, pour que l'historique reste complet. |
| 28 | Les données peuvent-elles être exportées ? | Oui. Les exports Excel de l'outil, et des sauvegardes complètes. |
| 29 | Protection contre XSS, CSRF et le détournement de clic ? | Oui. Politique de sécurité des contenus, jetons CSRF, `X-Frame-Options: DENY` et textes échappés (section 9). |
| 30 | Contrôles sur les fichiers déposés ? | Type contrôlé sur le contenu, taille limitée, fichiers servis avec une politique stricte. Aucune recherche de logiciel malveillant. |
| 31 | Les dépendances sont-elles contrôlées ? | Oui. Versions exactes, et un contrôle `pip-audit` sur GitHub qui informe sans bloquer. Chaque image a un SBOM signé et un rapport des failles connues. |
| 32 | Y a-t-il des tests de sécurité automatiques ? | Des tests automatiques contrôlent les droits des rôles, le cloisonnement des espaces et la politique de sécurité des contenus. Il n'y a pas d'outil d'analyse statique dédié : `ruff` ne contrôle que des défauts mécaniques. |
| 33 | Le conteneur tourne-t-il en root ? | Non. Sous l'utilisateur 1000. Le code appartient à root, et l'outil ne peut pas le modifier. |
| 34 | Système de fichiers en lecture seule ou capacités retirées pour le conteneur ? | Pas réglé dans `docker-compose.yml`. |
| 35 | Quels ports sont ouverts ? | 80 et 443 avec Caddy, ou 8000 sans lui (section 3) |
| 36 | Y a-t-il des sauvegardes ? | Oui. Automatiques, signées, non chiffrées. L'IT les copie hors du serveur, ou l'outil les copie lui-même vers un stockage compatible S3 ou un serveur SFTP réglé par un gestionnaire des espaces. |
| 37 | Combien de données peut-on perdre (RPO) ? | Ce qui a été fait depuis la dernière sauvegarde : 1 jour par défaut, 6 heures avec la fréquence la plus courte |
| 38 | Combien de temps prend une restauration ? | Quelques secondes pour la restauration elle-même. La reconstruction d'un serveur à partir de la copie externe est documentée, mais son temps total n'est pas mesuré. Il n'y a pas de haute disponibilité. |
| 39 | Les journaux peuvent-ils aller vers un SIEM ? | Oui, avec le pilote de journaux de Docker. L'outil n'a pas de connecteur SIEM. Il peut envoyer des alertes par e-mail sur la santé de l'installation (section 8). |
| 40 | Comment les corrections de sécurité sont-elles livrées ? | Comme une nouvelle version de l'outil, appliquée par l'IT avec `./update.sh`, ou la nuit par les mises à jour automatiques du serveur (image signée seulement, sauvegarde avant, retour arrière automatique). Seule la dernière version reçoit les corrections. |
