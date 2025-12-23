# CinéConnect

Une plateforme collaborative pour découvrir, filtrer, noter et échanger autour des films.

---

## 1. Titre du projet

**CinéConnect**  
Une plateforme collaborative pour découvrir, filtrer, noter et échanger autour des films.

---

## 2. Contexte et présentation

**CinéConnect** est une application web destinée aux passionnés de cinéma souhaitant explorer et discuter autour de leurs films préférés.

L’objectif du projet est de concevoir une application web full stack, de la base de données au front-end, tout en favorisant la collaboration, la rigueur et la maîtrise des outils du développement web actuel.

### Problématique

Les plateformes de cinéma ou de streaming limitent souvent les échanges entre spectateurs.  
**CinéConnect** propose une approche communautaire : une application qui permet à chacun de noter des films dans une bibliothèque existante et d’échanger en temps réel autour des œuvres avec des amis inscrits sur la plateforme.

### Public visé

Les cinéphiles passionnés souhaitant :

- Rechercher des films par catégorie (action, drame, science-fiction, etc.).
- Filtrer les résultats selon la note, l’année ou le réalisateur (optionnel pour le rendu).
- Discuter en direct avec d’autres utilisateurs.
- Noter des films.

### Objectifs pédagogiques et techniques

- Concevoir une application web full stack en plusieurs phases.
- Comprendre le routing typé avec **TanStack Router**.
- Découvrir la consommation d’API (OMDb) dans la première partie du projet, avant la mise en place de la base de données dans la dernière partie.
- Implémenter un backend **Node.js** sécurisé avec **JWT**.
- Documenter l’API avec **Swagger**.
- Travailler en équipe de 3 personnes maximum avec **GitHub**.

---

## 3. Contraintes techniques

### Stack complète

**Frontend :**

- React.js (TypeScript optionnel)
- TanStack Router (routing typé)
- TanStack Query (gestion des requêtes)
- TailwindCSS
- Mode clair/sombre et responsive (optionnel)

**Backend :**

- Node.js + Express
- Drizzle ORM
- Authentification JWT
- WebSocket (**Socket.io**) pour la discussion en temps réel

**Base de données :**

- PostgreSQL
- Tables suggérées : `users`, `films`, `categories`, `reviews`, `messages`, `friends`

**Outils :**

- pnpm (mono repo)
- Swagger
- Jest ou ViteTest
- Git / GitHub

**Optionnel :**

- Filtres dynamiques (année, note, réalisateur).
- Recommandations automatiques.

---

## 4. Étapes du projet

### 4.1. Analyse & conception

- Cahier des charges, parcours utilisateur, maquettes.
- Schéma des tables et modélisation.

### 4.2. Mono repo

- Initialisation avec **pnpm**.
- Configuration des workspaces.

### 4.3. Frontend (React + TanStack Router)

- Routes à implémenter :
  - `/`
  - `/films`
  - `/films/:categorie`
  - `/film/:id`
  - `/profil`
  - `/discussion`
- Composants dynamiques, filtres.

### 4.4. Backend (Node.js + Express + Drizzle)

- Endpoints REST.
- Authentification **JWT**.
- WebSocket (Socket.io).
- Documentation **Swagger**.

### 4.5. Base de données

- Création des tables.
- Relations.
- Migrations.

### 4.6. Tests & documentation

- Tests unitaires et d’intégration.
- Documentation de l’API via Swagger.

### 4.7. Présentation finale

- Démonstration de l’application.
- Rapport.
- Soutenance avec code review.

---

## 5. Livrables attendus

- Dépôt GitHub **mono repo** contenant :
  - `/frontend` (React)
  - `/backend` (Node.js)
  - `/shared` (code partagé entre le front et le back)
  - `/docs` (rapport, schémas, README)
- README clair et complet.
- Rapport de 2 à 3 pages incluant :
  - Architecture.
  - Répartition des rôles.
  - Choix techniques.

---

## 6. Bibliographie et ressources

Technologies et outils principaux à consulter :

- React.js
- TanStack Router
- TanStack Query
- Node.js
- Drizzle ORM
- PostgreSQL
- Socket.io
- Swagger
- TailwindCSS
- Jest

---

## 7. Remarque importante sur l’organisation pédagogique

Le projet **CinéConnect** est conçu pour accompagner votre progression pédagogique à travers plusieurs modules du premier semestre : **React**, **UI**, **Base de données**, et **Node.js / JWT / Swagger**.

Chaque matière contribue à une partie spécifique du développement et sera évaluée séparément.

### 7.1. Cours de React

- Consommation des données via l’API **OMDb** (The Open Movie Database).
- Focalisation sur :
  - Construction des interfaces.
  - Routing avec TanStack Router.
  - Consommation d’API.
- Objectif : comprendre la logique du front avant toute persistance de données.

### 7.2. Cours d’UI (User Interface)

- Amélioration du design.
- Application des notions :
  - Accessibilité.
  - Responsive design.
  - Cohérence visuelle.
- Objectif : obtenir un front propre, clair et professionnel avant l’intégration du backend.

### 7.3. Cours de Base de données

- Module décorrélé du projet, axé sur :
  - Modélisation.
  - Conception relationnelle.
- Les compétences acquises seront réinvesties lors de l’intégration du backend.

### 7.4. Cours de Node.js / JWT / Swagger

- Finalisation du projet :
  - Connexion à la base PostgreSQL via Drizzle ORM.
  - Sécurisation via JWT.
  - Documentation API avec Swagger.
- Le projet complet devra être rendu **au plus tard le 25 mars 2026 à 00h00**.

---

## 8. Organisation et déroulé du projet

Le projet **CinéConnect** s’étale sur l’ensemble du premier semestre et accompagne les différents modules de développement web.

Chaque cours correspond à une étape clé de la réalisation. L’objectif est de construire le projet de manière cohérente, itérative et professionnelle.

### 8.1. Après le cours de React : découverte et structuration

À ce stade, vous avez acquis les bases de **React** et du routing avec **TanStack Router**.

À faire :

- Découvrir et maîtriser le sujet du projet en lisant attentivement le document.
- Structurer le dépôt :
  - `/frontend`
  - `/backend`
  - `/docs`
- Créer la structure du projet React et mettre en place le routing avec TanStack Router.
- Consommer l’API **OMDb** via TanStack Query pour afficher des listes de films, leurs affiches et leurs informations.
- Mettre en place quelques composants d’affichage :
  - Cartes de films.
  - Barre de navigation.
  - Pages principales.

**Objectif :** disposer d’un prototype fonctionnel côté front, capable d’afficher des données externes (sans base locale). Cette étape constitue la fondation du projet.

### 8.2. Après le cours d’UI (User Interface) : améliorer le design

Une fois le front fonctionnel, focalisation sur l’interface utilisateur et l’expérience visuelle.

À faire :

- Structurer l’interface avec **TailwindCSS**.
- Travailler l’ergonomie :
  - Navigation fluide.
  - Cohérence visuelle.
  - Hiérarchie des informations.
- Mettre en place :
  - Mode clair/sombre.
  - Design responsive.
- Soigner :
  - Typographie.
  - Espacements.
  - Disposition.
  - Lisibilité.

**Objectif :** obtenir un front-end professionnel et agréable à utiliser, prêt à être relié au futur backend.

### 8.3. Après le cours de Base de données : conception technique

Ce cours, même s’il est décorrélé, sert de base conceptuelle.

À faire :

- Concevoir le **modèle relationnel** du projet :
  - Tables.
  - Relations.
  - Clés étrangères.
- Réfléchir à l’intégration dans PostgreSQL via **Drizzle ORM**.
- Déterminer les entités principales :
  - `users`
  - `films`
  - `categories`
  - `reviews`
  - `messages`
  - etc.

**Objectif :** disposer d’un modèle de données clair et cohérent, prêt à être implémenté dans la phase Node.js.

### 8.4. Après le cours de Node.js / JWT / Swagger : finalisation

Dernière phase : mise en place du backend complet et finalisation du projet.

À faire :

- Créer les endpoints RESTful avec **Express**.
- Connecter le backend à PostgreSQL via **Drizzle ORM**.
- Mettre en place l’authentification sécurisée **JWT** :
  - Inscription.
  - Connexion.
  - Sessions.
- Intégrer la documentation **Swagger** de l’API.
- Implémenter le chat en temps réel avec **WebSocket (Socket.io)**.
- Réaliser les tests :
  - Unitaires.
  - Intégration (Jest ou ViteTest).

**Objectif :** livrer une application full stack complète et fonctionnelle, intégrant base de données, sécurité et communication temps réel.

### 8.5. Date de rendu et conseils généraux

- Date limite de rendu : **25 mars 2026 à 00h00**.
- Les soutenances auront lieu à partir de cette date, selon le planning communiqué par les enseignants.

**Conseils :**

- Travailler régulièrement à chaque étape (ne pas tout faire à la fin).
- Utiliser GitHub pour suivre la progression du groupe (branches par fonctionnalité).
- Soigner la documentation dès le début :
  - README.
  - Swagger.
  - Commentaires.
- Répartir clairement les rôles : un membre ne doit pas tout faire seul.
- Respecter les bonnes pratiques de code et de collaboration vues en cours.

**Objectif final :** présenter un projet complet, propre, documenté et maîtrisé, démontrant la compréhension des différentes technologies abordées.

---

## 9. Grille d’évaluation

Chaque matière (React, UI, Base de données, Node.js) est évaluée selon la grille suivante.

### React

**Architecture front & routing TanStack**

- Structure du front.
- Cohérence du code.
- Composants fonctionnels.
- Intégration de l’API OMDb.  
  **Barème :** /15

**Fonctionnalités principales**

- Navigation.
- Filtres.
- Affichage des films.
- Interactions.  
  **Barème :** /10

### UI / Design

**Interface & UX**

- Esthétique.
- Responsive.
- Accessibilité.
- Dark/light mode.  
  **Barème :** /10

### Base de données

**Conception et modélisation**

- MCD/UML.
- Relations entre entités.
- Intégrité des données.  
  **Barème :** /10

**Création et migrations**

- Mise en œuvre technique sous PostgreSQL / Drizzle.  
  **Barème :** /5

### Node.js / Backend

**Architecture & sécurité**

- API REST.
- JWT.
- WebSocket.
- Swagger.
- Performance.  
  **Barème :** /15

**Qualité du code & documentation**

- Modularité.
- Clarté.
- Documentation Swagger.
- README.  
  **Barème :** /10

**Tests**

- Tests unitaires et d’intégration.
- Couverture et pertinence.  
  **Barème :** /10

### Collaboration & gestion de projet

**GitHub & organisation, méthode de travail**

- Utilisation de GitHub.
- Branches par fonctionnalité.
- Répartition des tâches.
- Communication.  
  **Barème :** /10

### Rédaction

**Clarté de la rédaction, maîtrise du sujet**

- Pertinence.
- Cohérence technique.
- Posture professionnelle.  
  **Barème :** /5

---

## Total

**Total : /100**

Bonne lecture et bonne réussite dans la réalisation du projet **CinéConnect**.

Inspiration https://letterboxd.com/
