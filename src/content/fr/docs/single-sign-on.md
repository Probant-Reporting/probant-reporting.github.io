---
title: "Se connecter avec le compte d'entreprise"
description: "Cette page explique comment chacun peut se connecter à l'outil avec son compte d'entreprise, par OpenID Connect. Les sections 1 à 3 sont pour les…"
order: 4.5
group: "Run"
source: "docs/fr/connexion_entreprise.md"
---

Cette page explique comment chacun peut se connecter à l'outil avec son compte d'entreprise, par OpenID Connect. Les
sections 1 à 3 sont pour les gestionnaires des espaces qui la règlent. La section 4 est pour la personne qui gère le
fournisseur d'identité. Les sections 5 à 8 sont pour tous ceux qui s'occupent de l'outil, l'IT comprise.

La fonction marche avec tout fournisseur OpenID Connect standard, par exemple Microsoft Entra ID, Google, Okta ou
Keycloak. L'outil n'a aucun code propre à l'un d'eux.

---

## 1. Ce qu'elle fait et ce qu'elle ne fait pas

Le compte d'entreprise **prouve seulement qui est la personne**. Tout le reste reste dans l'outil.

| Question | Réponse |
|---|---|
| L'outil crée-t-il un compte à la première connexion ? | Non. Un administrateur crée le compte dans **Administration › Comptes**, comme avant. |
| L'outil prend-il le rôle, l'équipe ou les attributions chez le fournisseur ? | Non. Le rôle et les attributions se règlent dans l'outil, espace par espace. |
| Comment l'outil trouve-t-il le compte ? | Par l'adresse e-mail. Le fournisseur doit dire que l'adresse est vérifiée. Les majuscules ne comptent pas. |
| Et si deux comptes ont la même adresse ? | La connexion est refusée. |
| Et si aucun compte actif n'a cette adresse ? | La connexion est refusée avec un message simple : « Demandez à votre administrateur de créer votre compte ». Le message ne dit jamais si l'adresse existe. |
| Une mise à jour change-t-elle quelque chose ? | Non. La connexion d'entreprise reste éteinte tant qu'un gestionnaire des espaces ne l'allume pas. |
| Se déconnecter déconnecte-t-il aussi du fournisseur ? | Non. **Se déconnecter** ferme la session de l'outil seulement. La session chez le fournisseur reste ouverte : le clic suivant sur le bouton peut reconnecter la personne sans mot de passe. |
| Un réglage par espace ? | Non. Un seul réglage pour toute l'installation, car les comptes sont communs à tous les espaces. |

---

## 2. Avant de commencer

- Vous devez être **gestionnaire des espaces**. Eux seuls voient **Administration › Paramètres › Connexion d'entreprise**.
- L'IT permet le HTTPS sortant (TCP 443) du serveur vers le fournisseur. L'outil n'appelle le fournisseur que quand une
  personne clique sur le bouton, quand le fournisseur la renvoie vers l'outil, et quand vous vérifiez ou enregistrez le
  réglage.
- L'IT renseigne `PUBLIC_URL` dans `.env` (par exemple `https://reporting.example.com`). L'outil en tire l'adresse de
  retour. Sans `PUBLIC_URL`, l'outil prend l'adresse de la page ouverte.
- La version tout-en-un (Windows ou Mac) ne contient pas la connexion d'entreprise.

---

## 3. La régler, pas à pas

1. Chez votre fournisseur, déclarez l'outil comme application web (section 4). Gardez trois valeurs : l'adresse
   **issuer**, l'**identifiant du client** et le **secret du client**.
2. Dans l'outil, allez dans **Administration › Paramètres › Connexion d'entreprise**.
3. Copiez l'**Adresse de retour (redirect URI)** que montre la page, avec **Copier**, dans les réglages de
   l'application chez votre fournisseur. C'est toujours l'adresse de la racine de l'outil suivie de
   `/connexion/entreprise/retour/`, pour tous les espaces.
4. Saisissez l'**Adresse du fournisseur (issuer)**, l'**Identifiant du client** et le **Secret du client**.
5. Cliquez sur **Vérifier le fournisseur**. L'outil lit les réglages du fournisseur et ses clés de signature. Il dit
   ce qui manque. Rien n'est enregistré.
6. Facultatif : saisissez un **Texte du bouton**, par exemple avec le nom de votre compte d'entreprise. Vide, chacun voit
   le texte par défaut dans sa langue.
7. Cochez **Permettre la connexion avec le compte d'entreprise**, puis cliquez sur **Enregistrer**. L'outil vérifie de
   nouveau le fournisseur avant de l'allumer. S'il manque quelque chose, il enregistre le reste et la fonction reste
   éteinte.
8. Ouvrez la page de connexion dans une fenêtre privée et essayez avec un compte qui existe dans l'outil.

Le secret du client est enregistré chiffré. Il n'est jamais réaffiché, ni écrit au journal, dans une sauvegarde, dans
l'archive du registre commun ou dans l'export de configuration. Pour le remplacer, saisissez-en un nouveau et
enregistrez. Pour l'effacer, cliquez sur **Retirer le secret** : la connexion d'entreprise s'éteint. Pour le garder,
laissez le champ vide. Si vous changez l'adresse du fournisseur ou l'identifiant du client, l'outil efface le secret
enregistré, pour qu'il ne parte jamais vers un autre fournisseur : saisissez-le de nouveau dans le même enregistrement.
D'ici là, la connexion d'entreprise est éteinte et chacun se connecte avec son mot de passe.

### Les deux choix de prudence

Les deux sont éteints par défaut. Gardez-les éteints sauf raison précise.

| Choix | Éteint (conseillé) | Allumé |
|---|---|---|
| **Chacun peut encore se connecter avec son mot de passe** | Seuls les gestionnaires des espaces gardent leur mot de passe, comme comptes de secours. Une personne que l'entreprise bloque chez le fournisseur ne peut plus se connecter. | Chacun peut aussi utiliser le mot de passe de l'outil. Une personne bloquée chez le fournisseur peut encore s'en servir. |
| **Accepter une adresse e-mail quand le fournisseur ne dit pas si elle est vérifiée** | Le fournisseur doit envoyer `email_verified: true`. | Une adresse sans `email_verified` est acceptée. Une adresse avec `email_verified: false` est toujours refusée. |

---

## 4. Chez votre fournisseur

### Ce que demande tout fournisseur

| Réglage | Valeur |
|---|---|
| Type d'application | Application web (client confidentiel), avec un secret du client |
| Flux | Code d'autorisation. L'outil envoie toujours PKCE en `S256`. |
| Adresse de retour | L'adresse montrée sur la page (étape 3) |
| Portées (scopes) | `openid email` |
| Signature du jeton d'identité | RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 ou ES512. Les signatures à clé partagée (HS256) et les jetons non signés sont refusés. |
| Revendications du jeton d'identité | `email` et, sauf si vous avez allumé le second choix de prudence, `email_verified` |
| Authentification du client | `client_secret_basic` (de préférence) ou `client_secret_post` |

Limitez chez le fournisseur qui peut utiliser l'application (attribution de personnes ou de groupes) quand il le
permet. L'outil refuse aussi toute personne sans compte actif dans l'outil.

### Remarques pour quelques fournisseurs

Vérifiez la documentation à jour de votre fournisseur : les noms des menus changent.

- **Keycloak.** Issuer : `https://<hôte>/realms/<realm>`. Créez un client OpenID Connect avec **Client authentication**
  et **Standard flow** allumés. Mettez l'adresse de retour dans **Valid redirect URIs**. Vous pouvez imposer PKCE
  (`S256`) dans les réglages avancés du client. Keycloak envoie `email_verified` d'après le champ **Email verified** de
  chaque utilisateur.
- **Google.** Issuer : `https://accounts.google.com`. Créez un client OAuth de type **Application Web** et ajoutez
  l'adresse de retour. Pour une organisation Google Workspace, mettez l'écran de consentement en **Interne** : seuls les
  comptes de votre organisation peuvent alors se connecter. Google envoie `email_verified`.
- **Okta.** Issuer : votre domaine Okta (`https://<domaine>`) ou l'adresse de votre serveur d'autorisation (par exemple
  `https://<domaine>/oauth2/default`). Créez une intégration **OIDC – Web Application** avec l'adresse de retour en
  **Sign-in redirect URI**, et attribuez-la aux personnes ou aux groupes. Okta envoie `email_verified` avec la portée
  `email`.
- **Microsoft Entra ID.** Issuer : `https://login.microsoftonline.com/<ID du locataire>/v2.0`, avec l'identifiant de
  votre locataire (tenant). Les adresses partagées (`common`, `organizations`) sont refusées : leurs réglages ne donnent
  pas l'issuer de votre locataire. Déclarez une application à locataire unique, ajoutez une plateforme **Web** avec
  l'adresse de retour, créez un secret du client et ajoutez la revendication facultative `email` au jeton d'identité.
  Entra n'envoie pas `email_verified` : par défaut, l'outil refuse alors la connexion (section 8). N'allumez le second
  choix de prudence que si ces trois conditions sont vraies : l'application est à locataire unique, **Affectation
  requise** est allumée, et seuls les administrateurs de votre entreprise règlent les adresses e-mail des utilisateurs
  dans l'annuaire (aucun compte invité attribué à l'application).

---

## 5. Comptes de secours : impossible de s'enfermer dehors

- Les **gestionnaires des espaces** gardent toujours leur mot de passe, même connexion d'entreprise allumée. La personne
  qui l'allume est gestionnaire : elle peut toujours se connecter avec son mot de passe et l'éteindre.
- Fournisseur en panne : le bouton donne un message, et les gestionnaires se connectent avec leur mot de passe. Quand
  ils éteignent la connexion d'entreprise, chacun retrouve son mot de passe.
- Si aucun gestionnaire ne peut se connecter, l'IT coupe la connexion d'entreprise pour toute l'installation :
  `COMPANY_SIGN_IN=off` dans `.env`, puis `docker compose up -d`. Le bouton disparaît et chacun retrouve son mot de
  passe. Le réglage de l'outil est gardé : retirez la variable pour la rallumer.
- Un gestionnaire dont le compte est bloqué (**Bloquer** dans **Personnes et accès**) n'est plus un compte de secours.

Ayez au moins deux gestionnaires des espaces.

---

## 6. Ce qui change pour chacun

| Point | Connexion d'entreprise allumée |
|---|---|
| Page de connexion | Un bouton en haut, puis les champs e-mail et mot de passe pour les comptes de secours. |
| Mot de passe provisoire | Quand une personne ne peut pas utiliser de mot de passe, l'outil ne lui demande pas de remplacer son mot de passe provisoire. |
| Mot de passe de l'outil | Refusé à tous sauf aux gestionnaires des espaces (sauf si le premier choix de prudence est allumé). Tout échec par mot de passe reçoit le même message, que le mot de passe soit juste ou faux : « E-mail ou mot de passe incorrect », avec un rappel du bouton du compte d'entreprise. La page ne confirme jamais qu'un compte existe. |
| Jetons des assistants (MCP) | Une personne qui ne peut pas se connecter avec un mot de passe ne peut pas utiliser d'assistant : ses jetons sont refusés tout de suite (l'assistant reçoit un message clair), et **Mon compte** ne lui permet pas d'en créer. Un jeton ne peut pas suivre ce que décide l'entreprise (compte bloqué, départ). Les gestionnaires des espaces gardent leurs jetons, et tout le monde quand **Chacun peut encore se connecter avec son mot de passe** est coché. Quand la connexion d'entreprise est éteinte, les jetons d'avant servent de nouveau jusqu'à leur expiration. Un administrateur peut révoquer des jetons dans **Administration › Paramètres › Assistants**. |
| Session | Même durée qu'avant (12 heures). Une session ouverte par mot de passe suit la règle du mot de passe à chaque page : quand on allume la connexion d'entreprise, ou quand un gestionnaire des espaces perd ce rôle, une personne qui n'a plus droit au mot de passe est déconnectée à la page suivante et invitée à se connecter avec le compte d'entreprise. Les sessions ouvertes par le compte d'entreprise ne changent pas. |
| Historique des connexions | Chaque ligne donne la méthode (**Mot de passe** ou **Compte d'entreprise**). Une connexion d'entreprise refusée donne un motif court. Aucun jeton ni aucune adresse réseau n'est jamais gardé. |
| Blocage après des échecs | Inchangé pour les mots de passe. Une connexion d'entreprise ne compte jamais comme un échec de mot de passe. Les refus qui ne demandent aucun compte chez le fournisseur (connexion expirée ou rejouée, erreur du fournisseur) comptent pour l'adresse réseau : après 30 en 15 minutes, le bouton est refusé depuis cette adresse pendant 15 minutes. Un refus après que la personne s'est connectée chez le fournisseur (aucun compte dans l'outil, par exemple) ne compte que pour elle : après 10 en 15 minutes, elle est refusée pendant 15 minutes. Il ne bloque jamais les autres personnes derrière le même proxy d'entreprise. Quand la connexion d'entreprise est éteinte, l'adresse de retour n'écrit rien. |

### Lien avec le compte d'entreprise

À la première connexion, l'outil lie le compte au compte d'entreprise qui l'a ouvert (l'identifiant `sub` du
fournisseur, qui ne change pas quand l'adresse e-mail change). Une connexion suivante avec la même adresse mais un autre
compte d'entreprise est refusée. Si votre fournisseur donne une adresse à une autre personne, retirez le lien de cette
adresse dans **Liens avec les comptes d'entreprise** : la connexion suivante crée un nouveau lien.

---

## 7. Sécurité

Ce que l'outil vérifie à chaque connexion :

- `state` (un seul usage, 10 minutes), `nonce` et vérificateur PKCE `S256`, tirés au hasard et gardés dans la session ;
- la signature du jeton d'identité avec les clés publiées par le fournisseur (le changement de clé est suivi : une clé
  inconnue fait relire les clés, au plus une fois par minute) ;
- `iss` égal à l'issuer du fournisseur, `aud` qui contient l'identifiant du client (`azp` égal à lui quand il y a
  plusieurs destinataires), `exp` et `iat` (60 secondes de marge pour les horloges) ;
- la page demandée après la connexion (`next`) : seulement une adresse de l'outil, jamais un autre site.

L'adresse du fournisseur est saisie par un gestionnaire des espaces. Pour limiter ce que le serveur peut être amené à
appeler :

- `https` seulement ; aucune adresse du serveur lui-même (`127.0.0.0/8`, `::1`), aucune adresse locale au lien
  (`169.254.0.0/16`, par exemple le service de métadonnées d'un hébergeur), aucun autre service de métadonnées connu
  (AWS et Google en IPv6, Alibaba, Oracle, Azure), aucune adresse multicast ou réservée. Les
  adresses privées restent permises, pour un fournisseur interne au réseau de l'entreprise.
- L'outil revérifie l'adresse après la connexion, ne suit aucune redirection, ne lit que du JSON, 1 Mo au plus, avec un
  délai court (5 secondes, `COMPANY_SIGN_IN_TIMEOUT`).
- **Vérifier le fournisseur** ne donne qu'un motif court, jamais le contenu de la réponse.

La politique de sécurité des contenus des pages, la protection CSRF et les règles de session ne changent pas. Le bouton
est un lien : la politique garde `form-action 'self'`.

---

## 8. Dépannage

| Ce que voit la personne | Cause probable | Que faire |
|---|---|---|
| « Votre compte d'entreprise ne correspond à aucun compte de l'outil » | Aucun compte actif avec cette adresse, deux comptes avec cette adresse, compte bloqué, ou adresse liée à un autre compte d'entreprise. | Vérifiez **Administration › Comptes** et l'adresse e-mail. Lisez le motif dans l'**Historique des connexions**. Retirez le lien si l'adresse a changé de propriétaire. |
| « Votre entreprise n'a pas confirmé votre adresse e-mail » | Le fournisseur n'envoie pas `email`, envoie `email_verified: false`, ou n'envoie pas `email_verified`. | Ajoutez la revendication `email` chez le fournisseur. Marquez l'adresse comme vérifiée chez le fournisseur. Pour un fournisseur qui n'envoie jamais `email_verified`, lisez la section 4. |
| « La connexion avec le compte d'entreprise n'a pas fonctionné » | Le fournisseur ne répond pas, le secret du client est faux, les horloges diffèrent de plus d'une minute, ou le jeton est refusé. | Cliquez sur **Vérifier le fournisseur**. Lisez le journal de l'outil : `docker compose logs web \| grep connexion_entreprise` donne la cause technique (jamais un jeton). |
| « La connexion a pris trop de temps ou a déjà servi » | La personne a attendu plus de 10 minutes chez le fournisseur, a utilisé le bouton Précédent, ou le réglage a changé entre-temps. | Cliquez de nouveau sur le bouton. |
| « Connectez-vous avec votre compte d'entreprise (bouton ci-dessus) » | La personne a tapé son mot de passe, mais seuls les gestionnaires des espaces peuvent encore s'en servir. | Utilisez le bouton. |
| Le bouton n'apparaît pas | Connexion d'entreprise éteinte, incomplète, ou coupée par l'IT (`COMPANY_SIGN_IN=off`). | Ouvrez **Administration › Paramètres › Connexion d'entreprise**. |
| **Vérifier le fournisseur** : « Le fournisseur donne une autre adresse issuer » | L'issuer saisi n'est pas exactement celui que publie le fournisseur. | Recopiez exactement la valeur `issuer` du fournisseur (pour Microsoft Entra ID, l'adresse avec l'identifiant de votre locataire). |
| **Vérifier le fournisseur** : « Adresse refusée » | `http`, une adresse du serveur lui-même ou une adresse locale au lien. | Utilisez l'adresse `https` du fournisseur. |
| « Le secret du client enregistré n'est plus lisible » | La clé secrète de l'installation a changé (`DJANGO_SECRET_KEY`, ou restauration sur un autre serveur). | Saisissez de nouveau le secret. |

Après une restauration du registre commun (`restore --shared`), la connexion d'entreprise est éteinte et les liens avec
les comptes d'entreprise sont retirés (ils ne sont jamais dans l'archive) : réglez-la de nouveau. D'ici là, chacun se
connecte avec le mot de passe de l'outil que contient l'archive. La commande liste ce qu'elle a remis à zéro.
