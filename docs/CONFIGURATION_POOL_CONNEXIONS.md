# Configuration du Pool de Connexions Prisma

## Problème

Lors de l'exécution de la migration complète, vous pouvez rencontrer l'erreur :
```
Timed out fetching a new connection from the connection pool
```

Cela se produit lorsque trop de requêtes sont exécutées en parallèle et épuisent le pool de connexions Prisma.

## Solution

### 1. Configuration dans DATABASE_URL

Ajoutez les paramètres de pool de connexions à votre `DATABASE_URL` dans le fichier `.env` :

```env
DATABASE_URL="mysql://root:axel2014@192.168.1.49:3306/mars?schema=public&connection_limit=20&pool_timeout=20"
```

**Paramètres disponibles :**
- `connection_limit` : Nombre maximum de connexions dans le pool (défaut: 13)
- `pool_timeout` : Timeout en secondes pour obtenir une connexion (défaut: 10)

### 2. Modifications apportées au code

#### Traitement par lots dans `updateDispoEnvIds`

La fonction `updateDispoEnvIds` traite maintenant les mises à jour par lots de 50 au lieu de toutes en parallèle :

```typescript
const BATCH_SIZE = 50; // Traiter 50 mises à jour à la fois
```

#### Délai entre les étapes de migration

Un délai de 500ms a été ajouté entre chaque étape de migration pour laisser le pool de connexions se récupérer.

### 3. Recommandations

- **Pour les migrations importantes** : Augmentez `connection_limit` à 20-30
- **Pour les environnements de production** : Utilisez un pool de connexions dédié ou augmentez les limites
- **En cas de timeout persistant** : Réduisez `BATCH_SIZE` dans `updateDispoEnvIds` (actuellement 50)

### 4. Vérification

Après modification de `DATABASE_URL`, redémarrez l'application pour que les changements prennent effet.

