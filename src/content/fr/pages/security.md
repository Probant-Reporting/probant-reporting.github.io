---
title: "Sécurité et données"
description: "Où sont vos données, qui peut les voir, comment chacun se connecte, les protections actives par défaut, l'image signée, les mises à jour et les sauvegardes."
order: 1
group: "Trust"
---

Vos données restent sur le serveur que vous choisissez : votre propre serveur avec Docker, ou un hébergement clé en main chez Clever Cloud. L'outil n'envoie aucune donnée d'utilisation ni aucune statistique, ni à ceux qui le développent ni à personne d'autre.

Pour une revue de sécurité, envoyez à votre équipe sécurité le [Dossier de sécurité](/docs/security-overview/) : architecture, données gardées, flux réseau, chiffrement, et des réponses courtes aux questions habituelles. La liste de ce que l'IT prépare est dans [Ce qu'il faut préparer](/docs/it-request/).

## Qui voit quoi

- Les administrateurs créent les comptes dans l'outil et donnent un rôle à chaque personne.
- Chaque personne ne voit que les organisations et les KPI que son rôle permet.
- Le lecteur et l'auditeur sont en lecture seule.
- L'historique garde chaque modification : qui a saisi, modifié ou validé une valeur, et quand.
- Les assistants IA ne se connectent que si un administrateur l'autorise. Un assistant a les mêmes droits que la personne qui le connecte. Chaque appel est gardé dans l'historique.
- Un exercice clôturé reste tel qu'il a été publié : son arbre des organisations et ses chiffres sont gardés.

## Comment chacun se connecte

- Par défaut, avec un mot de passe. Après 5 échecs de connexion pour un même identifiant depuis une même adresse, la connexion est refusée pendant 15 minutes.
- Ou avec son compte d'entreprise, par OpenID Connect : par exemple Microsoft Entra ID, Google, Okta ou Keycloak. C'est éteint par défaut. Un gestionnaire des espaces l'allume pour toute l'installation.
- Le compte d'entreprise prouve seulement qui est la personne. L'outil ne crée aucun compte et ne prend aucun rôle chez le fournisseur : les comptes et les rôles restent dans l'outil.
- Quand la connexion d'entreprise est allumée, seuls les gestionnaires des espaces gardent leur mot de passe, comme comptes de secours. Une personne que votre entreprise bloque chez le fournisseur ne peut plus se connecter. Une personne qui ne peut pas se connecter avec un mot de passe ne peut pas non plus utiliser d'assistant IA.
- L'outil n'a pas de second facteur à lui. Avec le compte d'entreprise, votre fournisseur applique le sien. L'outil ne prend en charge ni SAML ni LDAP.

## Les protections actives par défaut

- Le serveur tourne sans les droits root.
- Une session expire au bout de 12 heures.
- Les fichiers de preuve ne sont servis qu'après un contrôle des droits. Un lien direct ne suffit pas pour en ouvrir un.
- L'outil envoie les en-têtes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` et `Referrer-Policy: same-origin`.
- En HTTPS, le certificat est créé et renouvelé automatiquement. Ou l'outil utilise le certificat de votre entreprise.
- Les mots de passe et les secrets enregistrés dans l'outil (serveur d'e-mails, copie des sauvegardes, connexion d'entreprise) sont chiffrés. L'outil ne les réaffiche jamais, et les redemande quand leur destination change. Seul un gestionnaire des espaces change ces réglages, qui valent pour toute l'installation.

## Image signée et mises à jour

- Chaque image publiée, à partir de la version 1.1.0, est signée. Sa liste de composants (SBOM) l'accompagne, et chaque release contient un rapport des failles connues.
- L'installation et les mises à jour contrôlent chaque fichier avec la liste signée de la version. Si la liste manque ou si un fichier ne correspond pas, rien ne change.
- Après une installation en une commande, le serveur installe chaque nouvelle version la nuit, 3 jours après sa publication. Il n'installe qu'une image dont la signature est vérifiée, sauvegarde d'abord chaque espace, et revient à la version précédente si la nouvelle ne répond pas. Un gestionnaire des espaces peut choisir d'être seulement prévenu, ou éteindre ces mises à jour.
- L'outil lui-même ne se connecte jamais à internet pour chercher une nouvelle version : une tâche du serveur fait ce travail.
- Les corrections de sécurité arrivent dans la dernière version seulement. Pour signaler une faille, suivez la [politique de sécurité](https://github.com/Probant-Reporting/probant/blob/main/docs/fr/securite.md).

## Sauvegardes

- L'outil se sauvegarde tout seul. Une sauvegarde contient la base de données et les fichiers de preuve.
- Un administrateur peut restaurer une sauvegarde depuis l'outil, après une confirmation.
- Gardez une copie des sauvegardes hors du serveur. Votre équipe informatique les copie. Ou un gestionnaire des espaces règle une destination dans l'outil, un stockage compatible S3 ou un serveur SFTP : l'outil y copie alors chaque nouvelle sauvegarde. Par défaut, il ne supprime rien à la destination.
- Si une sauvegarde ou une copie échoue, une alerte par e-mail vous prévient. Sur une installation neuve, les alertes sont allumées dès que les e-mails sont réglés. Sur une installation que vous mettez à jour, elles restent éteintes tant qu'un gestionnaire des espaces ne les allume pas.
- Les sauvegardes sont signées, pas chiffrées. Le chiffrement du disque revient à votre équipe informatique.
- La version tout-en-un, pour un essai sur un ordinateur, n'a ni copie hors de l'ordinateur ni connexion d'entreprise.

Plus de détails pour l'IT : [Sauvegarder et restaurer](/docs/back-up-and-restore/), [Mettre à jour l'outil](/docs/update-the-tool/), [Se connecter avec le compte d'entreprise](/docs/single-sign-on/), [Modifier les réglages](/docs/change-the-settings/).
