# Migration des tables chrono-tâches

## Problème

La commande `npx prisma migrate dev` a échoué, mais `npx prisma generate` a fonctionné. Il faut donc appliquer manuellement le SQL pour créer les tables.

## Solution : Application manuelle du SQL

### Option 1 : Script PowerShell (recommandé)

Exécutez le script PowerShell qui automatise le processus :

```powershell
.\scripts\apply-chrono-tasks-migration.ps1
```

Ce script :
1. Lit votre fichier `.env` pour obtenir les informations de connexion
2. Applique le script SQL automatiquement si `mysql` est disponible
3. Génère le client Prisma

### Option 2 : Application manuelle directe

#### Étape 1 : Exécuter le SQL

**Avec mysql en ligne de commande :**
```bash
mysql -u root -p votre_base_de_donnees < scripts/create-chrono-tasks-tables.sql
```

**Ou depuis un client MySQL (phpMyAdmin, MySQL Workbench, etc.) :**
1. Ouvrez le fichier `scripts/create-chrono-tasks-tables.sql`
2. Copiez tout le contenu
3. Collez-le dans votre client MySQL et exécutez

#### Étape 2 : Générer le client Prisma

Après avoir créé les tables, générez le client Prisma :

```bash
npx prisma generate
```

### Option 3 : Utiliser Prisma db push (alternative)

Si vous préférez utiliser Prisma directement :

```bash
npx prisma db push
```

Cette commande synchronise le schéma Prisma avec la base de données sans créer de migration.

## Vérification

Après l'application, vérifiez que les tables ont été créées :

```sql
SHOW TABLES LIKE 'harptask%';
```

Vous devriez voir :
- `harptask` (chrono-tâches)
- `harptaskitem` (tâches individuelles)

## Structure des tables

### `harptask` (chrono-tâches)
- `id` : Identifiant unique
- `identifier` : Identifiant unique de la chrono-tâche
- `title` : Titre de la chrono-tâche
- `descr` : Description (optionnel)
- `status` : Statut (EN_ATTENTE, EN_COURS, BLOQUE, TERMINE, SUCCES, ECHEC)
- `createdBy` : ID de l'utilisateur créateur (optionnel)
- `createdAt` : Date de création
- `updatedAt` : Date de mise à jour

### `harptaskitem` (tâches individuelles)
- `id` : Identifiant unique
- `taskId` : ID de la chrono-tâche parente
- `identifier` : Identifiant de la tâche
- `title` : Titre de la tâche
- `duration` : Durée en minutes (optionnel)
- `startDate` : Date/heure de début (optionnel)
- `endDate` : Date/heure de fin (optionnel)
- `resourceNetid` : Trigramme netid de la ressource (optionnel)
- `predecessorNetid` : Trigramme netid de la tâche prédécesseur (optionnel)
- `predecessorId` : ID de la tâche prédécesseur (optionnel, relation)
- `status` : Statut (EN_ATTENTE, EN_COURS, BLOQUE, TERMINE, SUCCES, ECHEC)
- `comment` : Commentaire (optionnel)
- `order` : Ordre d'affichage
- `createdAt` : Date de création
- `updatedAt` : Date de mise à jour

## Après la migration

Une fois les tables créées et le client Prisma généré, vous pouvez :

1. **Accéder à l'interface** : `/list/tasks`
2. **Créer des chrono-tâches** : Via le bouton "Créer une chrono-tâche"
3. **Importer depuis Excel** : Via le bouton "Importer depuis Excel"
4. **Gérer les tâches** : Voir, modifier, changer les statuts

## Dépannage

### Erreur : "Table already exists"
Les tables existent déjà. Vous pouvez soit :
- Les supprimer et les recréer (attention aux données !)
- Ou continuer, les tables sont déjà prêtes

### Erreur : "Foreign key constraint fails"
Vérifiez que la table `harptask` a été créée avant `harptaskitem`.

### Erreur de connexion MySQL
Vérifiez votre fichier `.env` et que `DATABASE_URL` est correctement configuré.
