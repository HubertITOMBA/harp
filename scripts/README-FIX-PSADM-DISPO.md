# Guide de résolution de l'erreur psadm_dispo (errno: 150)

## Problème

L'erreur `errno: 150 "Foreign key constraint is incorrectly formed"` se produit lorsque Prisma essaie de créer la table `psadm_dispo` avec des contraintes de clé étrangère vers `psadm_env` et `psadm_statenv`, mais :

1. Les tables référencées n'existent pas encore
2. Les colonnes référencées ne sont pas des clés primaires
3. Les types de données ne correspondent pas
4. Les tables n'utilisent pas le moteur InnoDB

## Solution 1 : Créer toutes les tables dans le bon ordre (Recommandé)

Prisma doit créer les tables dans le bon ordre. Si `psadm_env` et `psadm_statenv` n'existent pas encore :

```bash
# 1. Vérifiez que toutes les migrations précédentes sont appliquées
npx prisma migrate status

# 2. Appliquez toutes les migrations manquantes
npx prisma migrate deploy

# 3. Si nécessaire, créez toutes les tables depuis le schéma
npx prisma db push
```

## Solution 2 : Diagnostic et correction manuelle

### Étape 1 : Exécuter le script de diagnostic

```powershell
# Windows PowerShell
.\scripts\fix-prisma-dispo-error.ps1 -DatabaseName "decembre_25" -DatabaseUser "root" -DatabasePassword "votre_mot_de_passe"
```

Ou manuellement avec MySQL :

```sql
-- Exécutez le script SQL de diagnostic
source scripts/fix-psadm-dispo-before-prisma.sql;
```

### Étape 2 : Vérifier que les tables référencées existent

```sql
-- Vérifier psadm_env
SHOW TABLES LIKE 'psadm_env';
DESCRIBE psadm_env;

-- Vérifier psadm_statenv
SHOW TABLES LIKE 'psadm_statenv';
DESCRIBE psadm_statenv;
```

### Étape 3 : Si les tables n'existent pas, les créer d'abord

Si `psadm_env` ou `psadm_statenv` n'existent pas, vous devez les créer d'abord avec Prisma :

```bash
# Créer toutes les tables manquantes
npx prisma db push
```

### Étape 4 : Créer psadm_dispo manuellement (si nécessaire)

Si Prisma continue d'échouer, créez la table manuellement :

```sql
-- Exécutez le script de création
source scripts/create-psadm-dispo.sql;
```

Puis marquez la migration comme appliquée :

```bash
npx prisma migrate resolve --applied <nom_de_la_migration>
```

## Solution 3 : Modifier temporairement le schéma Prisma

Si vous devez créer `psadm_dispo` avant les autres tables, vous pouvez temporairement commenter les relations dans `prisma/schema.prisma` :

```prisma
model psadm_dispo {
  env           String        @db.VarChar(32)
  statenvId     Int           @default(4)
  statenv       String        @db.VarChar(32)
  fromdate      DateTime      @db.DateTime(0)
  msg           String?       @db.VarChar(255)
  // Commenter temporairement les relations
  // psadm_env     psadm_env     @relation(fields: [env], references: [env], map: "psadm_dispo_ibfk_1")
  // psadm_statenv psadm_statenv @relation(fields: [statenv], references: [statenv], map: "psadm_dispo_ibfk_2")
  statutenvId   Int?

  @@id([env, fromdate])
  @@index([statenv], map: "statenv")
  @@index([statenvId])
}
```

Puis :

1. Créez la table : `npx prisma db push`
2. Décommentez les relations
3. Ajoutez les contraintes manuellement avec `scripts/create-psadm-dispo.sql`

## Vérifications importantes

Avant de créer `psadm_dispo`, assurez-vous que :

- ✅ `psadm_env` existe et `env` est la clé primaire (varchar(32))
- ✅ `psadm_statenv` existe et `statenv` est la clé primaire (varchar(32))
- ✅ Les deux tables utilisent le moteur InnoDB
- ✅ Les types de données correspondent exactement (varchar(32) dans tous les cas)

## Scripts disponibles

1. **`check-psadm-dispo-dependencies.sql`** : Diagnostic complet des dépendances
2. **`fix-psadm-dispo-before-prisma.sql`** : Préparation avant migration Prisma
3. **`create-psadm-dispo.sql`** : Création manuelle de la table avec contraintes
4. **`fix-prisma-dispo-error.ps1`** : Script PowerShell de diagnostic et correction

## Ordre d'exécution recommandé

1. Exécutez le diagnostic : `.\scripts\fix-prisma-dispo-error.ps1`
2. Si tout est OK, exécutez : `npx prisma migrate dev`
3. Si Prisma échoue toujours, créez manuellement avec : `scripts/create-psadm-dispo.sql`
