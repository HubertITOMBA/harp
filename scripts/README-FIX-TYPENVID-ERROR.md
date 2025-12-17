# Guide de résolution de l'erreur de contrainte de clé étrangère typenvid

## Problème

L'erreur suivante se produit lors de `npx prisma db push` :

```
Error: Cannot add or update a child row: a foreign key constraint fails 
(`dbportal`.`#sql-56e4_333`, CONSTRAINT `envsharp_typenvid_fkey` FOREIGN KEY (`typenvid`) 
REFERENCES `harptypenv` (`typenvid`) ON DELETE SET NULL ON UPDATE CASCADE)
```

## Cause

Cette erreur indique que la table `envsharp` contient des valeurs dans la colonne `typenvid` qui n'existent pas dans la table `harptypenv.typenvid`. Ces valeurs sont appelées "orphelines" et empêchent la création de la contrainte de clé étrangère.

## Solution

### Option 1 : Script de migration complet (recommandé)

Exécutez le script de migration complet qui corrige automatiquement tous les problèmes :

```bash
# Se connecter à MySQL et exécuter le script
mysql -h localhost -P 3408 -u [votre_utilisateur] -p dbportal < scripts/migrate-complete-typenvid.sql
```

Ou via MySQL Workbench / phpMyAdmin, ouvrez et exécutez le fichier `scripts/migrate-complete-typenvid.sql`.

### Option 2 : Scripts séparés

Si vous préférez exécuter les scripts séparément :

1. **Diagnostic** : Exécutez d'abord le script de diagnostic pour voir les valeurs orphelines :
   ```sql
   -- Voir scripts/fix-envsharp-typenvid-orphans.sql (partie diagnostic)
   ```

2. **Correction** : Exécutez le script de migration pour `harptypenv` :
   ```bash
   mysql -h localhost -P 3408 -u [votre_utilisateur] -p dbportal < scripts/migrate-harptypenv-typenvid.sql
   ```

3. **Correction des orphelins** : Mettez à NULL les valeurs orphelines dans `envsharp` :
   ```sql
   UPDATE envsharp
   SET typenvid = NULL
   WHERE typenvid IS NOT NULL
     AND typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);
   ```

### Après la correction

Une fois les scripts exécutés avec succès, vous pouvez relancer :

```bash
npx prisma db push
```

## Détails techniques

### Ce que fait le script de migration complet

1. **Prépare `harptypenv.typenvid`** :
   - Ajoute la colonne `typenvid` si elle n'existe pas
   - Remplit les valeurs avec les `id` existants
   - Ajoute la contrainte unique
   - Rend la colonne NOT NULL

2. **Corrige les orphelins dans `envsharp`** :
   - Identifie les valeurs orphelines
   - Met à NULL les valeurs qui n'existent pas dans `harptypenv.typenvid`

3. **Vérifie** :
   - Affiche un rapport final de l'état des données

### Pourquoi mettre à NULL plutôt que créer des entrées ?

La stratégie choisie est de mettre à NULL les valeurs orphelines car :
- C'est plus sûr (évite de créer des données invalides)
- La colonne `typenvid` dans `envsharp` est nullable (`Int?`)
- Les données peuvent être réassignées manuellement plus tard si nécessaire

Si vous préférez créer les entrées manquantes dans `harptypenv`, vous pouvez modifier le script pour utiliser l'Option B (voir `scripts/fix-envsharp-typenvid-orphans.sql`).

## Vérification

Après avoir exécuté les scripts, vérifiez qu'il n'y a plus d'orphelins :

```sql
SELECT COUNT(*) as orphan_count
FROM envsharp e
WHERE e.typenvid IS NOT NULL
  AND e.typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);
```

Cette requête doit retourner `0`.

