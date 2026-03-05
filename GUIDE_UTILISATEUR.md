# Guide Utilisateur - Portail HARP

## Table des matières

1. [Bienvenue](#bienvenue)
2. [Première connexion](#première-connexion)
3. [Navigation dans l'interface](#navigation-dans-linterface)
4. [Consulter les environnements](#consulter-les-environnements)
5. [Utiliser les outils](#utiliser-les-outils)
6. [Gérer votre profil](#gérer-votre-profil)
7. [Questions fréquentes](#questions-fréquentes)
8. [Dépannage](#dépannage)

---

## Bienvenue

### Qu'est-ce que le Portail HARP ?

Le **Portail HARP** (Human Resources & Payroll) est votre interface centralisée pour :
- 📊 **Consulter les environnements** PeopleSoft disponibles
- 🔍 **Visualiser les informations** serveurs et bases de données
- 🚀 **Lancer rapidement** vos outils de travail (PuTTY, SQL Developer, etc.)
- 👤 **Gérer votre profil** et vos accès

### Navigateurs supportés

- ✅ Microsoft Edge (recommandé)
- ✅ Google Chrome
- ✅ Mozilla Firefox
- ⚠️ Safari (fonctionnalités limitées)

---

## Première connexion

### Créer un compte

Si vous n'avez pas encore de compte :

1. **Accéder à la page d'inscription**
   - Ouvrir votre navigateur
   - Aller à l'adresse du portail (ex: `http://192.168.1.48:3000`)
   - Cliquer sur **"S'inscrire"** ou **"Créer un compte"**

2. **Remplir le formulaire**
   - **NetID** : Votre identifiant unique (ex: `hitomba`)
   - **Email** : Votre adresse email professionnelle
   - **Mot de passe** : Choisissez un mot de passe sécurisé
   - Confirmer le mot de passe

3. **Valider**
   - Cliquer sur **"Créer le compte"**
   - Vous serez automatiquement redirigé vers la page de connexion

### Se connecter

1. **Sur la page d'accueil**, cliquer sur **"Se connecter"**

2. **Saisir vos identifiants** :
   - **NetID** : Votre identifiant (pas votre email)
   - **Mot de passe** : Votre mot de passe

3. **Cliquer sur "Connexion"**

4. Vous serez redirigé vers votre **page d'accueil personnalisée** (`/home`)

### Mot de passe oublié

Si vous avez oublié votre mot de passe :

1. Sur la page de connexion, cliquer sur **"Mot de passe oublié ?"**
2. Saisir votre NetID ou email
3. Suivre les instructions reçues par email

> **Note** : Si vous ne recevez pas d'email, contactez votre administrateur.

---

## Navigation dans l'interface

### Structure de l'interface

L'interface est divisée en plusieurs zones :

```
┌─────────────────────────────────────────────────────────┐
│  [Logo HARP]                   [Barre de navigation]    │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│  Menu    │          Zone de contenu principale          │
│  latéral │                                               │
│          │                                               │
│  (icônes)│                                               │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

### Le menu latéral

Le menu latéral (à gauche) affiche les **environnements disponibles** selon vos droits d'accès.

Chaque élément du menu représente un **type d'environnement** :
- 🟢 **Environnements de développement**
- 🔵 **Environnements de test**
- 🟡 **Environnements de production**
- ⚪ **Autres environnements**

**Cliquer sur un élément** pour afficher la liste des environnements de ce type.

### La barre de navigation

En haut de la page, vous trouverez :
- **Votre profil** : Affiche votre NetID et vos informations
- **Paramètres** : Accès aux réglages (si autorisé)
- **Déconnexion** : Se déconnecter de l'application

### Navigation mobile

Sur mobile ou tablette :
- Le menu latéral est remplacé par un **menu hamburger** (☰) en haut à gauche
- Cliquer sur l'icône pour ouvrir/fermer le menu

---

## Consulter les environnements

### Accéder à la liste des environnements

1. **Dans le menu latéral**, cliquer sur le type d'environnement souhaité
2. La page affichera la **liste complète** des environnements disponibles

### Comprendre les informations affichées

Chaque environnement est présenté sous forme de **carte** avec plusieurs onglets :

#### 📋 Onglet "Environment"

Informations générales :
- **Nom de l'environnement** : Identifiant unique (ex: `DEV01`)
- **Statut** : Disponibilité (🟢 Disponible, 🟡 Maintenance, 🔴 Indisponible)
- **Version PeopleSoft** : Version installée
- **Version HARP** : Version de la release HARP
- **URL** : Lien vers l'environnement (si disponible)

#### 🗄️ Onglet "Oracle"

Informations base de données :
- **Instance Oracle** : SID de la base de données
- **Alias SQL*Net** : Alias de connexion
- **Schéma Oracle** : Schéma utilisé
- **Version Oracle** : Version de la base de données

**Actions disponibles** :
- 🔗 **Lancer SQL Developer** : Ouvrir SQL Developer avec la connexion configurée
- 🔗 **Lancer SQL*Plus** : Ouvrir SQL*Plus
- 🔗 **Lancer PSDMT** : Ouvrir PeopleSoft Data Mover

#### 🖥️ Onglet "Serveur"

Informations serveur :
- **Adresse IP** : IP du serveur
- **Nom du serveur** : Nom d'hôte
- **PS Home** : Répertoire d'installation PeopleSoft
- **Utilisateur PSoft** : Compte utilisateur PeopleSoft
- **Système d'exploitation** : OS du serveur

**Actions disponibles** :
- 🔗 **Se connecter via PuTTY** : Ouvrir une session SSH
- 🔗 **Ouvrir FileZilla** : Accéder aux fichiers via FTP/SFTP

### Filtrer et rechercher

Utilisez les **filtres** en haut de la page pour :
- Rechercher un environnement par nom
- Filtrer par statut
- Filtrer par version

### Voir les détails d'un environnement

Cliquer sur une **carte d'environnement** pour voir plus de détails :
- Historique des disponibilités
- Messages d'information
- Informations techniques détaillées

---

## Utiliser les outils

### Lancer PuTTY (Connexion SSH)

PuTTY permet de se connecter aux serveurs via SSH.

#### Première utilisation : configurer le launcher sur votre poste

Lors de la première utilisation, votre navigateur peut afficher une **boîte de dialogue** pour le protocole `mylaunch://` :

- Vérifiez que la fenêtre indique bien que l’application à lancer est **PuTTY** (ou un outil connu).
- ✅ Cocher **« Toujours autoriser l’ouverture de ce type de lien »** (ou équivalent) pour ne plus être interrogé à chaque fois.
- Cliquer sur **« Autoriser » / « Ouvrir l’application »**.

Si, au lieu de la boîte de dialogue, le navigateur affiche un message du type **« protocole mylaunch inconnu »** ou si rien ne se passe :

- le **launcher n’est pas installé** ou mal configuré sur votre poste ;
- contactez votre **administrateur** afin qu’il installe / corrige le launcher selon la procédure décrite dans le mode d’emploi administrateur.

> **Note** : Une fois le launcher configuré, les clics sur « Se connecter via PuTTY » ouvriront directement PuTTY avec la bonne IP et, en production, avec votre NetID et votre clé SSH (si enregistrés dans votre profil).

#### Méthode 1 : Depuis la page d'un environnement

1. Ouvrir un environnement dans l'onglet **"Serveur"**
2. Cliquer sur le lien **"Se connecter via PuTTY"** (à côté de l'adresse IP)
3. PuTTY s'ouvre automatiquement avec :
   - ✅ L'adresse IP du serveur
   - ✅ Votre NetID comme utilisateur
   - ✅ Votre clé SSH privée (si configurée)

#### Méthode 2 : Depuis la page Hub

1. Aller à **/hub** (via le menu ou directement)
2. Remplir le formulaire :
   - **Host** : Adresse IP ou nom du serveur
   - **User** : Votre NetID (pré-rempli)
   - **Port** : 22 (par défaut)
3. Cliquer sur **"Lancer PuTTY"**

### Lancer SQL Developer

SQL Developer permet de gérer les bases de données Oracle.

1. Ouvrir un environnement dans l'onglet **"Oracle"**
2. Cliquer sur le lien **"Schéma Oracle"** ou **"Alias SQL*Net"**
3. SQL Developer s'ouvre automatiquement

> **Note** : Vous devrez peut-être configurer la connexion la première fois dans SQL Developer.

### Lancer SQL*Plus

SQL*Plus est l'outil en ligne de commande pour Oracle.

1. Ouvrir un environnement dans l'onglet **"Oracle"**
2. Cliquer sur le lien **"Instance Oracle"** ou **"Alias SQL*Net"**
3. SQL*Plus s'ouvre dans une fenêtre de commande

### Lancer PeopleSoft Data Mover (PSDMT)

PSDMT permet d'importer/exporter des données PeopleSoft.

1. Ouvrir un environnement dans l'onglet **"Oracle"**
2. Cliquer sur le lien **"Schéma Oracle"**
3. PSDMT s'ouvre automatiquement

### Lancer FileZilla

FileZilla permet de transférer des fichiers via FTP/SFTP.

1. Ouvrir un environnement dans l'onglet **"Serveur"**
2. Cliquer sur le lien **"PS Home"** (ex: `/opt/psft/pt/ps_home/HARP_FILES`)
3. FileZilla s'ouvre

> **Note** : Vous devrez peut-être configurer la connexion SFTP manuellement dans FileZilla la première fois.

### Autres outils disponibles

- **WinSCP** : Alternative à FileZilla pour SFTP
- **WinMerge** : Comparaison de fichiers
- **Perl** : Exécution de scripts Perl
- **PeopleSoft IDE** : Environnement de développement PeopleSoft

---

## Gérer votre profil

### Accéder à votre profil

1. Cliquer sur votre **NetID** dans la barre de navigation (en haut)
2. Ou aller directement à **/home**

### Informations affichées

Votre page de profil affiche :
- **Nom** : Votre nom complet
- **Email** : Votre adresse email
- **NetID** : Votre identifiant unique
- **Rôles** : Liste de vos rôles et permissions

### Modifier votre profil

1. Aller à **/harp/user/profile**
2. Modifier les informations souhaitées
3. Cliquer sur **"Enregistrer"**

> **Note** : Certaines informations (comme le NetID) ne peuvent pas être modifiées. Contactez votre administrateur si nécessaire.

### Changer votre mot de passe

1. Aller à **/settings** (si disponible selon vos droits)
2. Ou contacter votre administrateur

### Voir vos rôles

Vos **rôles** déterminent ce que vous pouvez faire dans l'application :
- **USER** : Accès de base (lecture)
- **PSADMIN** : Accès aux outils PeopleSoft
- **TMA_LOCAL** : Accès aux environnements locaux
- **ADMIN** : Accès administrateur (si applicable)

Si vous pensez qu'un rôle vous manque, contactez votre administrateur.

---

## Questions fréquentes

### Connexion

**Q : Je ne peux pas me connecter, que faire ?**

R : Vérifiez :
1. ✅ Votre NetID est correct (pas votre email)
2. ✅ Votre mot de passe est correct (attention aux majuscules/minuscules)
3. ✅ Votre compte existe (contactez l'admin si besoin)
4. ✅ Vous avez une connexion Internet

**Q : J'ai oublié mon mot de passe**

R : Utilisez la fonction **"Mot de passe oublié"** sur la page de connexion, ou contactez votre administrateur.

**Q : Mon compte est bloqué**

R : Contactez votre administrateur pour débloquer votre compte.

### Navigation

**Q : Je ne vois pas certains environnements dans le menu**

R : Cela signifie que vous n'avez pas les droits d'accès nécessaires. Contactez votre administrateur pour obtenir les permissions.

**Q : Le menu ne s'affiche pas correctement**

R : 
- Essayez de **rafraîchir la page** (F5)
- Videz le **cache du navigateur**
- Essayez un autre navigateur

### Outils

**Q : PuTTY ne se lance pas quand je clique sur le lien**

R : Vérifiez :
1. ✅ PuTTY est installé sur votre machine
2. ✅ Le protocole `mylaunch://` est installé (contactez l'admin)
3. ✅ Votre navigateur autorise le lancement (voir la boîte de dialogue)
4. ✅ Votre clé SSH est configurée dans votre profil

**Q : SQL Developer ne se connecte pas automatiquement**

R : SQL Developer nécessite une configuration manuelle la première fois :
1. Ouvrir SQL Developer
2. Créer une nouvelle connexion
3. Utiliser les informations de l'environnement (SID, alias, schéma)

**Q : FileZilla ne se connecte pas**

R : FileZilla nécessite une configuration manuelle :
1. Ouvrir FileZilla
2. Créer un nouveau site SFTP
3. Utiliser :
   - **Hôte** : Adresse IP du serveur
   - **Utilisateur** : Votre NetID
   - **Port** : 22
   - **Clé privée** : Votre clé SSH

**Q : Une boîte de dialogue apparaît à chaque lancement d'outil**

R : 
1. Cocher **"Toujours autoriser"** dans la boîte de dialogue
2. Cliquer sur **"Autoriser"**
3. La boîte ne devrait plus apparaître

### Données

**Q : Les informations affichées sont incorrectes**

R : Contactez votre administrateur pour mettre à jour les données.

**Q : Un environnement est marqué comme "Indisponible"**

R : L'environnement est peut-être en maintenance. Consultez les messages d'information ou contactez votre administrateur.

---

## Dépannage

### Problèmes de connexion

#### Erreur "Le netid saisi n'existe pas"

**Solution** :
1. Vérifiez que vous utilisez bien votre **NetID** (pas votre email)
2. Contactez votre administrateur pour vérifier que votre compte existe

#### Erreur "Informations d'identification invalides"

**Solution** :
1. Vérifiez votre mot de passe (attention aux majuscules/minuscules)
2. Essayez de vous reconnecter
3. Si le problème persiste, utilisez "Mot de passe oublié" ou contactez l'admin

### Problèmes d'affichage

#### La page ne charge pas complètement

**Solutions** :
1. **Rafraîchir la page** (F5 ou Ctrl+R)
2. **Vider le cache** :
   - Edge/Chrome : Ctrl+Shift+Delete
   - Sélectionner "Images et fichiers en cache"
   - Cliquer sur "Effacer"
3. **Désactiver les extensions** du navigateur temporairement
4. **Essayer un autre navigateur**

#### Le menu ne s'affiche pas

**Solutions** :
1. Rafraîchir la page
2. Vérifier que vous êtes bien connecté
3. Vider le cache du navigateur
4. Contacter l'administrateur si le problème persiste

### Problèmes avec les outils

#### Le protocole mylaunch:// ne fonctionne pas

**Symptômes** :
- Rien ne se passe quand vous cliquez sur un lien
- Message d'erreur dans le navigateur

**Solutions** :
1. **Vérifier l'installation** :
   - Contactez votre administrateur pour vérifier que le protocole est installé
   - Le protocole doit être installé sur chaque machine

2. **Autoriser le protocole** :
   - Quand une boîte de dialogue apparaît, cocher **"Toujours autoriser"**
   - Cliquer sur **"Autoriser"**

3. **Vérifier les permissions** :
   - Contactez votre administrateur pour vérifier les permissions

#### PuTTY ne se lance pas

**Vérifications** :
1. ✅ PuTTY est installé : `C:\Program Files\PuTTY\putty.exe`
2. ✅ Le protocole est installé (voir ci-dessus)
3. ✅ Votre clé SSH est configurée dans votre profil utilisateur

**Solution** : Contactez votre administrateur si le problème persiste.

#### SQL Developer ne se lance pas

**Vérifications** :
1. ✅ SQL Developer est installé : `C:\apps\sqldeveloper\sqldeveloper.exe`
2. ✅ Le protocole est installé

**Solution** : Contactez votre administrateur si le problème persiste.

### Problèmes de performance

#### La page est lente à charger

**Solutions** :
1. Vérifier votre connexion Internet
2. Fermer les autres onglets du navigateur
3. Vider le cache du navigateur
4. Contacter l'administrateur si le problème persiste

#### Les données ne se mettent pas à jour

**Solutions** :
1. Rafraîchir la page (F5)
2. Vider le cache du navigateur
3. Contacter l'administrateur si les données semblent obsolètes

### Contacter le support

Si aucun des problèmes ci-dessus ne correspond à votre situation :

1. **Notez les détails** :
   - Quelle action avez-vous effectuée ?
   - Quel message d'erreur apparaît (le copier-coller) ?
   - À quel moment le problème survient-il ?

2. **Contactez votre administrateur** avec ces informations

3. **Capture d'écran** : Prendre une capture d'écran peut aider à diagnostiquer le problème

---

## Conseils et astuces

### Raccourcis clavier

- **F5** : Rafraîchir la page
- **Ctrl+R** : Rafraîchir la page
- **Ctrl+Shift+R** : Rafraîchir sans cache
- **Ctrl+F** : Rechercher dans la page
- **Ctrl+W** : Fermer l'onglet actuel

### Navigation rapide

- **URL directe** : Vous pouvez accéder directement à un environnement en tapant son URL (ex: `/harp/envs/1`)
- **Onglets** : Ouvrir les environnements dans de nouveaux onglets (clic droit > "Ouvrir dans un nouvel onglet")

### Personnalisation

- **Thème** : L'application s'adapte automatiquement au thème de votre système (clair/sombre)
- **Taille du texte** : Utilisez Ctrl+Molette de la souris pour zoomer/dézoomer

### Sécurité

- 🔒 **Déconnexion** : Toujours vous déconnecter quand vous avez terminé, surtout sur un ordinateur partagé
- 🔑 **Mot de passe** : Ne partagez jamais votre mot de passe
- 🚫 **Sessions** : Fermez votre navigateur si vous quittez votre poste

---

## Glossaire

- **NetID** : Identifiant unique de connexion (ex: `hitomba`)
- **Environnement** : Instance d'une application PeopleSoft (DEV, TEST, PROD)
- **SID** : System Identifier, identifiant unique d'une base de données Oracle
- **Alias SQL*Net** : Nom d'alias pour se connecter à une base Oracle
- **Schéma Oracle** : Espace de nom dans une base de données Oracle
- **PS Home** : Répertoire d'installation de PeopleSoft
- **PuTTY** : Client SSH pour se connecter aux serveurs Linux/Unix
- **SQL Developer** : Outil graphique pour gérer les bases de données Oracle
- **SQL*Plus** : Outil en ligne de commande pour Oracle
- **PSDMT** : PeopleSoft Data Mover Tool, outil d'import/export de données
- **FileZilla** : Client FTP/SFTP pour transférer des fichiers

---

**Version du guide** : 1.0  
**Date de mise à jour** : 2025-11-06  
**Pour toute question** : Contactez votre administrateur système

---

## Index rapide

- [Se connecter](#se-connecter)
- [Voir les environnements](#consulter-les-environnements)
- [Lancer PuTTY](#lancer-putty-connexion-ssh)
- [Lancer SQL Developer](#lancer-sql-developer)
- [Modifier mon profil](#gérer-votre-profil)
- [Problèmes de connexion](#problèmes-de-connexion)
- [PuTTY ne fonctionne pas](#putty-ne-se-lance-pas)

