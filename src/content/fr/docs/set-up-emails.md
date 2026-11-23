---
title: "Configurer les e-mails (SMTP)"
description: "Sans SMTP, l'outil n'envoie aucun e-mail. Il écrit seulement les messages dans le journal (docker compose logs web)."
order: 7
group: "Run"
source: "docs/fr/installation.md"
---

Pour configurer les e-mails :

1. Ajoutez ces valeurs dans `.env` :

   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURITY=starttls        # starttls (587), ssl (465) ou none
   SMTP_USER=reporting@example.com
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

2. Lancez `docker compose up -d`.
3. Allez dans **Administration › Paramètres › Hébergement**, puis cliquez sur **Envoyer un e-mail de test**. Si
   l'e-mail ne part pas, un message donne la cause exacte.

Sans SMTP, l'outil n'envoie aucun e-mail. Il écrit seulement les messages dans le journal (`docker compose logs web`).

## Relances

L'équipe responsable gère les e-mails de relance dans **Tableau de bord › Relancer…**. Chaque personne reçoit un seul
e-mail, sans copie. L'e-mail liste ce qui lui reste à saisir. Avant d'envoyer l'e-mail, l'outil affiche l'aperçu exact
du message. L'équipe responsable règle le modèle.

L'équipe responsable peut activer les relances automatiques dans la même page. L'outil les envoie aux jours choisis
avant la fin de la saisie. Il les vérifie chaque jour à `REMINDER_TIME` (09:00 par défaut). `PUBLIC_URL` donne
l'adresse mise dans ces e-mails. Par défaut, l'outil déduit cette adresse de `DOMAIN`.
