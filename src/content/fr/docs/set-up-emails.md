---
title: "Configurer les e-mails (SMTP)"
description: "L'outil envoie les e-mails par le serveur d'e-mails (SMTP) de votre entreprise : relances et e-mails de test. Vous pouvez régler ce serveur de deux façons.…"
order: 7
group: "Run"
source: "docs/fr/installation.md"
---

L'outil envoie les e-mails par le serveur d'e-mails (SMTP) de votre entreprise : relances et e-mails de test. Vous
pouvez régler ce serveur de deux façons. Les réglages valent pour toute l'installation, pour tous les espaces.

| Façon | Qui | Quand l'utiliser |
|---|---|---|
| Dans l'outil : **Administration › Paramètres › Hébergement**, cadre **E-mails** | Un gestionnaire des espaces | La façon habituelle. L'IT donne seulement les réglages d'un compte d'envoi. Aucun redémarrage. |
| Dans le fichier `.env` (réglages `SMTP_…`) | L'IT | Quand l'IT veut garder les réglages sur le serveur. Ces réglages passent en priorité. |

Sans l'un ni l'autre, l'outil n'envoie aucun e-mail. Il écrit seulement les messages dans le journal
(`docker compose logs web`).

## Configurer les e-mails dans l'outil

Avant de commencer, demandez à l'IT les réglages d'un compte d'envoi : serveur, port, sécurité (STARTTLS ou SSL/TLS),
identifiant, mot de passe et adresse d'expédition. Le **Message à envoyer à l'IT** du cadre **E-mails** donne un texte
prêt.

Pour configurer les e-mails dans l'outil :

1. Allez dans **Administration › Paramètres › Hébergement**. Le cadre **E-mails** montre les champs du serveur d'envoi.
2. Saisissez le **Serveur d'envoi (SMTP)**, par exemple `smtp.example.com`, sans `smtp://` et sans le port.
3. Saisissez le **Port** et choisissez la **Sécurité** : **STARTTLS** (souvent le port 587) ou **SSL/TLS** (souvent le
   port 465). Avec ces deux choix, l'outil vérifie le certificat du serveur. **Aucune** envoie le mot de passe sans
   chiffrement : ne l'utilisez que sur un réseau interne fermé. Avec **Aucune** et un mot de passe, l'outil demande une confirmation.
4. Saisissez l'**Identifiant**, le **Mot de passe** et l'**Adresse d'expédition**.
5. Cliquez sur **Enregistrer**.
6. Sous **E-mail de test**, cliquez sur **Envoyer un e-mail de test**. Le test utilise les réglages enregistrés. Si
   l'e-mail ne part pas, un message donne la cause en clair : serveur introuvable, connexion refusée, délai dépassé,
   certificat, sécurité, identifiant ou mot de passe refusé, adresse d'expédition refusée.

Le mot de passe fonctionne ainsi :

- L'outil ne réaffiche jamais le mot de passe. Il ne l'écrit jamais dans l'historique, dans le journal, ni dans le
  fichier de configuration que vous exportez.
- Pour garder le mot de passe enregistré, laissez le champ vide quand vous enregistrez. Pour l'effacer, cliquez sur
  **Effacer le mot de passe**.
- Si vous changez le serveur, le port ou l'identifiant, ou si vous passez la sécurité à « Aucune », l'outil efface le
  mot de passe enregistré, pour qu'il ne parte jamais vers un autre serveur. Saisissez-le de nouveau dans le même
  enregistrement ; sinon, l'écran vous le dit.
- L'outil garde le mot de passe chiffré avec la clé secrète de l'installation (`DJANGO_SECRET_KEY`, ou le fichier
  `/data/.secret_key`). La sauvegarde d'un espace ne contient jamais les réglages des e-mails. La sauvegarde du registre
  commun (`backups/shared`, réservée à l'IT) les contient, avec le mot de passe chiffré.
- Si la clé secrète change, ou si l'IT restaure le registre commun sur un autre serveur, l'outil ne peut plus lire le
  mot de passe. Le cadre **E-mails** et **Paramètres › Santé** disent alors qu'il faut le saisir de nouveau. Aucun
  e-mail ne part d'ici là. Saisissez de nouveau le mot de passe et enregistrez.

Pour éviter qu'on détourne le bouton de test, l'outil accepte au plus 5 e-mails de test toutes les 15 minutes avec les
réglages de l'outil, et attend le serveur 10 secondes au plus. Le message d'erreur ne montre jamais la réponse du
serveur. Chaque test qui échoue est écrit dans l'historique.

Seul un gestionnaire des espaces peut changer ces réglages. Les autres administrateurs voient le serveur et l'adresse
d'expédition, et peuvent envoyer un e-mail de test avec les réglages enregistrés.

## Configurer les e-mails dans le fichier `.env`

Pour configurer les e-mails dans le fichier `.env` :

1. Ajoutez ces valeurs dans `.env` :

   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURITY=starttls        # starttls (587), ssl (465) ou none
   SMTP_USER=reporting@example.com
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

2. Lancez `docker compose up -d`.
3. Allez dans **Administration › Paramètres › Hébergement**, puis cliquez sur **Envoyer un e-mail de test**. Si
   l'e-mail ne part pas, un message donne la cause.

> **Remarque :** Quand `SMTP_HOST` est rempli, le fichier `.env` passe avant les réglages saisis dans l'outil. Le cadre
> **E-mails** montre alors les réglages du fichier `.env` en lecture seule (sans le mot de passe), avec la mention
> « Réglé par l'IT dans le fichier de réglages ». Pour revenir aux réglages de l'outil, videz `SMTP_HOST` et
> redémarrez l'outil.

## Relances

L'équipe responsable gère les e-mails de relance dans **Tableau de bord › Relancer…**. Chaque personne reçoit un seul
e-mail, sans copie. L'e-mail liste ce qui lui reste à saisir. Avant d'envoyer l'e-mail, l'outil affiche l'aperçu exact
du message. L'équipe responsable règle le modèle.

L'équipe responsable peut activer les relances automatiques dans la même page. L'outil les envoie aux jours choisis
avant la fin de la saisie. Il les vérifie chaque jour à `REMINDER_TIME` (09:00 par défaut). `PUBLIC_URL` donne
l'adresse mise dans ces e-mails. Par défaut, l'outil déduit cette adresse de `DOMAIN`.
