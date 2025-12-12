# Guide de Déploiement en Production - Système de Notifications

## Vue d'ensemble

Ce guide décrit les étapes pour déployer le système de notifications en production, incluant la création des tables de base de données et le déploiement du code.

## Tables de base de données

Le système de notifications utilise deux tables :

1. **`harpnotification`** : Stocke les notifications
   - `id` : Identifiant unique
   - `title` : Titre de la notification (VARCHAR 255)
   - `message` : Contenu de la notification (TEXT)
   - `createdBy` : ID de l'utilisateur créateur
   - `createdAt` : Date de création
   - `updatedAt` : Date de mise à jour

2. **`harpnotificationrecipient`** : Stocke les destinataires des notifications
   - `id` : Identifiant unique
   - `notificationId` : ID de la notification
   - `recipientType` : Type de destinataire ("USER" ou "ROLE")
   - `recipientId` : ID de l'utilisateur ou du rôle
   - `read` : Statut de lecture (boolean)
   - `readAt` : Date de lecture (nullable)

## Étapes de déploiement

### Étape 1 : Vérifier l'état actuel des migrations

```bash
# Vérifier l'état des migrations
npx prisma migrate status
```

Cette commande affichera :
- Les migrations déjà appliquées
- Les migrations en attente
- L'état de synchronisation avec le schéma

### Étape 2 : Créer la migration pour les notifications

Si les tables `harpnotification` et `harpnotificationrecipient` n'existent pas encore en production, vous devez créer une migration.

#### Option A : Migration automatique avec Prisma (Recommandé)

```bash
# En développement, créer la migration
npx prisma migrate dev --name add_notification_system

# En production, appliquer la migration
npx prisma migrate deploy
```

#### Option B : Création manuelle des tables (si Prisma migrate ne fonctionne pas)

Exécutez le script SQL suivant dans votre base de données de production :

```sql
-- Créer la table harpnotification
CREATE TABLE IF NOT EXISTS `harpnotification` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `harpnotification_createdBy_idx` (`createdBy`),
  CONSTRAINT `harpnotification_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table harpnotificationrecipient
CREATE TABLE IF NOT EXISTS `harpnotificationrecipient` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `notificationId` INT NOT NULL,
  `recipientType` VARCHAR(10) NOT NULL,
  `recipientId` INT NOT NULL,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` TIMESTAMP(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `harpnotifrecip_uniq` (`notificationId`, `recipientType`, `recipientId`),
  INDEX `harpnotificationrecipient_notificationId_idx` (`notificationId`),
  INDEX `harpnotificationrecipient_recipientType_recipientId_idx` (`recipientType`, `recipientId`),
  CONSTRAINT `harpnotificationrecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `harpnotification` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Étape 3 : Générer le client Prisma

```bash
# Générer le client Prisma avec les nouvelles tables
npx prisma generate
```

### Étape 4 : Vérifier la connexion à la base de données

Assurez-vous que votre fichier `.env` de production contient la bonne `DATABASE_URL` :

```env
DATABASE_URL="mysql://user:password@host:port/database?schema=public"
```

### Étape 5 : Déployer le code de l'application

#### 5.1. Build de l'application

```bash
# Build de production
npm run build
```

Cette commande :
- Génère automatiquement le client Prisma (`npx prisma generate`)
- Compile l'application Next.js
- Prépare les assets pour la production

#### 5.2. Démarrage de l'application

```bash
# Démarrer l'application en production
npm run start
```

L'application démarre sur le port 9352 (configuré dans `package.json`).

### Étape 6 : Vérifier le déploiement

#### 6.1. Vérifier les tables dans la base de données

```sql
-- Vérifier que les tables existent
SHOW TABLES LIKE 'harpnotification%';

-- Vérifier la structure de harpnotification
DESCRIBE harpnotification;

-- Vérifier la structure de harpnotificationrecipient
DESCRIBE harpnotificationrecipient;
```

#### 6.2. Tester l'interface utilisateur

1. **Créer une notification** :
   - Accéder à `/list/notifications`
   - Cliquer sur "Créer une notification"
   - Remplir le formulaire et envoyer

2. **Voir les notifications** :
   - Accéder à `/user/profile/notifications`
   - Vérifier que les notifications s'affichent correctement

3. **Marquer comme lu** :
   - Cliquer sur une notification non lue
   - Vérifier qu'elle est marquée comme lue

## Commandes de déploiement rapide

Pour un déploiement complet en une seule fois :

```bash
# 1. Appliquer les migrations de base de données
npx prisma migrate deploy

# 2. Générer le client Prisma
npx prisma generate

# 3. Build de l'application
npm run build

# 4. Démarrer l'application
npm run start
```

## Rollback (en cas de problème)

Si vous devez annuler le déploiement :

### Option 1 : Supprimer les tables (ATTENTION : perte de données)

```sql
-- Supprimer les tables dans l'ordre inverse
DROP TABLE IF EXISTS `harpnotificationrecipient`;
DROP TABLE IF EXISTS `harpnotification`;
```

### Option 2 : Revenir à une version précédente du code

```bash
# Restaurer le code depuis Git
git checkout <commit-hash-avant-notifications>

# Rebuild
npm run build

# Redémarrer
npm run start
```

## Vérifications post-déploiement

- [ ] Les tables `harpnotification` et `harpnotificationrecipient` existent
- [ ] Les contraintes de clés étrangères sont correctes
- [ ] Les index sont créés
- [ ] L'application démarre sans erreur
- [ ] La page `/list/notifications` s'affiche correctement
- [ ] La page `/user/profile/notifications` s'affiche correctement
- [ ] La création de notification fonctionne
- [ ] La lecture de notification fonctionne
- [ ] Le marquage "lu/non lu" fonctionne

## Dépannage

### Erreur : "Table doesn't exist"

**Solution** : Vérifiez que les migrations ont été appliquées :
```bash
npx prisma migrate status
npx prisma migrate deploy
```

### Erreur : "Foreign key constraint failed"

**Solution** : Vérifiez que la table `User` existe et contient les utilisateurs référencés dans `createdBy`.

### Erreur : "Connection pool timeout"

**Solution** : Augmentez le pool de connexions dans `DATABASE_URL` :
```env
DATABASE_URL="mysql://...?connection_limit=20&pool_timeout=20"
```

## Notes importantes

1. **Sauvegarde** : Toujours faire une sauvegarde de la base de données avant de déployer
2. **Maintenance** : Prévoir une fenêtre de maintenance pour le déploiement
3. **Tests** : Tester en environnement de staging avant la production
4. **Monitoring** : Surveiller les logs après le déploiement

## Support

En cas de problème, consulter :
- Les logs de l'application
- Les logs de la base de données
- La documentation Prisma : https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-production

