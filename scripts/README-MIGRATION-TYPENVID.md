# Migration de la colonne `typenvid` dans `harptypenv`

## Problème

La colonne `typenvid` a été ajoutée comme requise (`NOT NULL`) dans le schéma Prisma, mais il y a déjà 15 lignes existantes dans la table `harptypenv` en production qui n'ont pas de valeur pour cette colonne.

## Solution en 3 étapes

### Étape 1 : Ajouter la colonne comme nullable

Le schéma Prisma a été modifié pour rendre `typenvid` temporairement nullable. Exécutez :

```bash
npx prisma db push
```

Cela ajoutera la colonne `typenvid` comme nullable dans la base de données.

### Étape 2 : Remplir les valeurs existantes

Exécutez le script SQL pour remplir les valeurs existantes :

**Option A : Script PowerShell automatique (recommandé)**
```powershell
.\scripts\migrate-harptypenv-typenvid.ps1
```

**Option B : Exécution manuelle du SQL**

Si vous avez accès à MySQL en ligne de commande :
```bash
mysql -u root -p votre_base_de_donnees < scripts/migrate-harptypenv-typenvid.sql
```

Ou depuis un client MySQL (phpMyAdmin, MySQL Workbench, etc.) :
1. Ouvrez le fichier `scripts/migrate-harptypenv-typenvid.sql`
2. Copiez tout le contenu
3. Collez-le dans votre client MySQL et exécutez

### Étape 3 : Rendre la colonne requise

Une fois les valeurs remplies, modifiez le schéma Prisma pour rendre `typenvid` requis :

Dans `prisma/schema.prisma`, changez :
```prisma
typenvid Int?       @unique // Temporairement nullable pour la migration
```

En :
```prisma
typenvid Int        @unique
```

Puis exécutez :
```bash
npx prisma db push
```

## Vérification

Après la migration, vérifiez que toutes les lignes ont une valeur pour `typenvid` :

```sql
SELECT COUNT(*) FROM harptypenv WHERE typenvid IS NULL;
```

Le résultat doit être `0`.

## Notes importantes

- ⚠️ **Ne pas utiliser `--force-reset`** : cela supprimerait toutes les données
- ✅ Les valeurs existantes seront remplies avec leur `id` (qui est unique)
- ✅ La contrainte `UNIQUE` sera ajoutée après le remplissage des valeurs
- ✅ La colonne sera rendue `NOT NULL` à la fin

