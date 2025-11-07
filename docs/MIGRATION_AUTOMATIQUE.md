# Migration Automatique des Utilisateurs

## Vue d'ensemble

Le système de migration automatique s'exécute **une seule fois** lors du premier démarrage de l'application lorsque la table `User` est vide. Il migre automatiquement les utilisateurs depuis `psadm_user` vers la table `User` pour l'authentification.

## Fonctionnement

### 1. Détection automatique

Le système vérifie automatiquement si la table `User` est vide lors de la première requête HTTP (via le middleware).

### 2. Exécution des migrations

Si la table est vide, deux fonctions sont exécutées automatiquement dans l'ordre :

1. **`migrerLesUtilisateursNEW()`** : Migre tous les utilisateurs de `psadm_user` vers `User`
2. **`migrerLesRolesUtilisateurs()`** : Migre les rôles des utilisateurs vers `harpuseroles`

### 3. Sécurité et idempotence

- ✅ **Exécution unique** : La migration ne s'exécute qu'une seule fois
- ✅ **Thread-safe** : Protection contre les exécutions multiples simultanées
- ✅ **Vérification préalable** : Vérifie que la table est vide avant d'exécuter
- ✅ **Non-bloquant** : S'exécute de manière asynchrone pour ne pas bloquer les requêtes

## Fichiers impliqués

### `lib/init-migration.ts`
Fonction principale `ensureUserMigration()` qui :
- Vérifie si la table `User` est vide
- Exécute les deux fonctions de migration si nécessaire
- Gère les verrous pour éviter les exécutions multiples

### `middleware.ts`
Intègre l'appel automatique à `ensureUserMigration()` lors de la première requête.

### `app/api/init-migration/route.ts`
Route API pour déclencher manuellement la migration si nécessaire :
- `GET /api/init-migration` : Vérifie et exécute la migration
- `POST /api/init-migration` : Même fonctionnalité

## Utilisation

### Automatique (recommandé)

La migration s'exécute automatiquement au premier démarrage de l'application. Aucune action requise.

### Manuelle

Si vous souhaitez forcer l'exécution manuellement :

```bash
# Via curl
curl http://localhost:3000/api/init-migration

# Ou via le navigateur
http://localhost:3000/api/init-migration
```

## Logs

Les logs de migration apparaissent dans la console du serveur :

```
[Migration] ⚠️  La table User est vide. Démarrage de la migration automatique...
[Migration] Étape 1/2 : Migration des utilisateurs depuis psadm_user...
[Migration] ✅ Migration des utilisateurs terminée: X utilisateurs migrés...
[Migration] Étape 2/2 : Migration des rôles utilisateurs...
[Migration] ✅ Migration des rôles terminée: X rôles migrés...
[Migration] ✅ Migration complète ! X utilisateur(s) migré(s).
```

## Dépannage

### La migration ne s'exécute pas

1. Vérifier que la table `User` est bien vide :
   ```sql
   SELECT COUNT(*) FROM User;
   ```

2. Vérifier les logs du serveur pour voir les messages de migration

3. Appeler manuellement la route API :
   ```
   GET /api/init-migration
   ```

### Erreur lors de la migration

Les erreurs sont loggées dans la console. Vérifiez :
- Que la table `psadm_user` contient des données
- Que la connexion à la base de données fonctionne
- Que les permissions sont correctes

### Réinitialiser le flag de migration

Pour les tests, vous pouvez réinitialiser le flag :

```typescript
import { resetMigrationFlag } from "@/lib/init-migration";

resetMigrationFlag();
```

## Notes importantes

- ⚠️ La migration ne s'exécute **qu'une seule fois** par instance de serveur
- ⚠️ Si vous redémarrez le serveur, le flag est réinitialisé (mais la table ne sera plus vide)
- ⚠️ La migration est **idempotente** : si des utilisateurs existent déjà, ils ne seront pas dupliqués
- ✅ Les mots de passe sont migrés tels quels depuis `psadm_user.mdp`

