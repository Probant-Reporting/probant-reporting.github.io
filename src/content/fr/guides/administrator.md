---
title: "Administrateur"
who: "L'équipe qui pilote le reporting"
description: "Mettre en place {name}, ouvrir une campagne, suivre le taux de remplissage, envoyer les relances et exporter."
summary: "Mettre l'outil en place, piloter la campagne, relancer et exporter."
order: 1
---

## Mettre l'outil en place

Au premier lancement, l'assistant de mise en place vous guide pas à pas : identité, niveaux de l'arbre des organisations,
référentiels et première campagne. Chaque étape montre ce que verront les contributeurs, et vous pouvez passer une étape qui a une valeur par défaut.

- **Référentiels** : installez un modèle de la bibliothèque (la norme volontaire VS, la transparence des rémunérations ou les ESRS), composez un référentiel à partir de KPI existants, ou importez un fichier.
- **Organisations** : choisissez vos niveaux et leurs noms, puis ajoutez vos organisations.
- **Ouverte depuis** : pour un site qui ouvre en cours d'année, saisissez sa date d'ouverture dans ce champ. Le site compte dans les totaux à partir de cette date.
- **Comptes** : vous créez les comptes dans l'outil et vous donnez un rôle à chaque personne. Si un gestionnaire des espaces allume la connexion avec le compte d'entreprise, chacun se connecte avec lui, mais les comptes et les rôles viennent toujours d'ici.

## Piloter une campagne

1. Ouvrez une campagne pour un référentiel et une période. Réglez la date de fin de saisie.
2. Attribuez les KPI aux contributeurs.
3. Regardez le **Tableau de bord**. Il vous dit si vous êtes dans les temps, et où agir.
4. Relancez les personnes qui ont le plus à faire, ou activez les relances automatiques.
5. Traitez la liste **À traiter** : écarts et valeurs inattendues.
6. Clôturez la campagne. Ses valeurs deviennent le N-1 de la suivante. Un exercice clos reste tel qu'il a été publié. Si vous le rouvrez, vous choisissez de garder les chiffres de l'époque ou de recalculer avec l'organisation d'aujourd'hui.

## Exporter

Exportez des tableaux lisibles pour Excel, ou des fichiers CSV, depuis **Import / Export**. Pour la norme volontaire VS, vous exportez les valeurs vers le classeur officiel de l'EFRAG, dans **Formats officiels**.

## Vérifier que tout va bien

Allez dans **Administration › Paramètres › Santé**. Chaque ligne montre **Bon**, **À regarder** ou **En panne**, et que faire. En bas de la page, un gestionnaire des espaces allume les **Alertes par e-mail** : l'outil envoie alors un e-mail quand une sauvegarde échoue, que le disque est presque plein ou qu'une tâche de fond s'arrête. Sur une installation neuve, elles sont allumées dès que les e-mails sont réglés. Sur une installation qui existait avant elles, elles restent éteintes tant qu'un gestionnaire des espaces ne les allume pas. Quand le serveur est éteint, l'outil ne peut prévenir personne.

## Connecter des assistants IA

Le serveur MCP est éteint par défaut. Allumez-le dans **Administration › Paramètres › Assistants**. Chaque personne connecte ensuite son propre assistant, par exemple Claude, avec un jeton personnel créé dans **Mon compte**. Un assistant a les droits de cette personne, jamais plus. Les lecteurs et les auditeurs ne font que lire. L'historique garde chaque appel.
