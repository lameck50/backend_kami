# KAMI - Suivi en Temps Réel des Agents de Sécurité

## Aperçu

KAMI est une application complète conçue pour le suivi en temps réel des agents de sécurité. Elle permet aux superviseurs de visualiser la position des agents sur une carte, de gérer les utilisateurs, de définir des zones de geofencing et de recevoir des alertes. Les agents peuvent utiliser l'application pour signaler leur position, recevoir des missions et communiquer avec les superviseurs.

## Fonctionnalités

- **Authentification sécurisée:** Connexion basée sur les rôles (admin, superviseur, agent) avec des tokens JWT.
- **Tableau de bord par rôle:** Interfaces dédiées pour les administrateurs, les superviseurs et les agents.
- **Suivi en temps réel:** Visualisation de la position des agents sur une carte en temps réel.
- **Geofencing:** Création de zones géographiques et réception d'alertes lorsque les agents entrent ou sortent de ces zones.
- **Messagerie instantanée:** Communication en temps réel entre les superviseurs et les agents.
- **Gestion des missions:** Assignation et suivi des tâches pour les agents.
- **Rapports d'activité:** Génération de rapports journaliers et mensuels sur l'activité des agents.
- **Notifications Push:** Alertes en temps réel pour les superviseurs (inactivité, sortie de zone, etc.).

## Technologies Utilisées

### Backend
- **Framework:** Node.js avec Express.js
- **Base de données:** MongoDB avec Mongoose
- **Communication temps réel:** Socket.IO
- **Authentification:** JSON Web Tokens (JWT)
- **Déploiement:** Render

### Frontend
- **Framework:** Flutter
- **Gestion d'état:** Provider
- **Déploiement:** Netlify

## Comptes de Test

Pour la version de test de l'application, vous pouvez utiliser les identifiants suivants :

- **Superviseur:**
  - **Email:** `superviseur@kami.com`
  - **Mot de passe:** `password123`

- **Agent:**
  - **Email:** `agent1@kami.com`
  - **Mot de passe:** `password456`

- **Administrateur:**
  - **Email:** `admin@kami.com`
  - **Mot de passe:** `admin123`

## Déploiement

- **Backend:** Le backend est déployé sur Render et est configuré pour se connecter à une base de données MongoDB Atlas.
- **Frontend:** L'application web Flutter est déployée sur Netlify. Le site est mis à jour automatiquement après chaque push sur la branche `main` du repository frontend.

## Améliorations Futures

Pour finaliser l'application et la rendre prête pour une production à grande échelle, voici quelques améliorations possibles :

- **Notifications par SMS:** Intégrer un service tiers comme Twilio ou Vonage pour envoyer des alertes critiques par SMS, en plus des notifications push.
- **Tests automatisés:** Mettre en place des tests unitaires et d'intégration pour le backend et le frontend afin d'assurer la stabilité et la fiabilité de l'application.
- **Journal d'audit:** Implémenter un système de journalisation des actions critiques (ex: modifications de droits, suppression d'utilisateurs) pour un meilleur suivi et une sécurité accrue.
- **Interface d'administration plus riche:** Améliorer le tableau de bord de l'administrateur avec plus de statistiques et d'outils de gestion.
- **Optimisation des performances:** Analyser et optimiser les requêtes à la base de données et la communication en temps réel pour supporter un grand nombre d'agents simultanément.
- **Intégration CI/CD complète:** Mettre en place un pipeline d'intégration et de déploiement continus (CI/CD) avec des outils comme GitHub Actions pour automatiser les tests et les déploiements.
