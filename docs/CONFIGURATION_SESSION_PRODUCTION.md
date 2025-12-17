# Configuration de la Session en Production

## Configuration HTTPS

**HTTPS est maintenant activé par défaut** car les certificats SSL ont été installés par l'administrateur.

## Problème (si vous utilisez encore HTTP)

Après `npm run build`, chaque clic redirige vers la page de login. La session n'est pas persistée en production.

## Cause (HTTP uniquement)

En production avec HTTP (pas HTTPS), NextAuth active par défaut les cookies sécurisés (`useSecureCookies: true`), ce qui empêche les cookies de fonctionner correctement car les navigateurs refusent les cookies sécurisés sur des connexions non-HTTPS.

## Solution

### 1. Configuration dans `auth.ts`

La configuration a été mise à jour pour désactiver automatiquement les cookies sécurisés en HTTP :

```typescript
export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    // Configuration pour la production HTTP
    // Désactiver les cookies sécurisés si on utilise HTTP (pas HTTPS)
    useSecureCookies: process.env.AUTH_URL?.startsWith('https://') ?? false,
    trustHost: true, // Requis pour NextAuth v5 en production
    // ... reste de la configuration
});
```

### 2. Configuration dans `middleware.ts`

Le middleware utilise maintenant la même configuration pour la cohérence :

```typescript
const middlewareAuthConfig = {
  ...authConfig,
  useSecureCookies: process.env.AUTH_URL?.startsWith('https://') ?? false,
  trustHost: true,
};

const { auth } = NextAuth(middlewareAuthConfig);
```

### 3. Variables d'environnement requises

Assurez-vous que ces variables sont définies dans votre `.env` de production :

```env
# URL de base de l'application (sans slash final)
# HTTPS est maintenant activé par défaut (certificats installés)
AUTH_URL=https://localhost:9352
# Si vous utilisez encore HTTP (non recommandé) :
# AUTH_URL=https://localhost:9352

# Trust host (requis pour NextAuth en production)
AUTH_TRUST_HOST=true

# Secret pour chiffrer les sessions (obligatoire)
AUTH_SECRET=votre-secret-très-long-et-aléatoire
```

## Vérification

### 1. Vérifier les cookies dans le navigateur

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet "Application" > "Cookies"
3. Vérifier que les cookies NextAuth sont présents :
   - `authjs.session-token` (ou `__Secure-authjs.session-token` en HTTPS)
   - `authjs.csrf-token` (ou `__Host-authjs.csrf-token` en HTTPS)

### 2. Vérifier les logs

Si le problème persiste, activer les logs de debug dans `auth.ts` :

```typescript
export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    debug: process.env.NODE_ENV === 'development', // Activer en développement
    // ... reste de la configuration
});
```

### 3. Tester la session

1. Se connecter
2. Vérifier que les cookies sont créés
3. Naviguer vers une autre page
4. Vérifier que la session est toujours active (pas de redirection vers login)

## Notes importantes

- **HTTP vs HTTPS** : 
  - En HTTP : `useSecureCookies: false` (cookies normaux)
  - En HTTPS : `useSecureCookies: true` (cookies sécurisés avec préfixe `__Secure-`)
  
- **AUTH_URL** : 
  - Doit correspondre exactement à l'URL de votre application
  - Utilisée pour déterminer si on utilise HTTP ou HTTPS
  
- **AUTH_TRUST_HOST** : 
  - Doit être `true` en production
  - Permet à NextAuth de faire confiance à l'en-tête `Host` de la requête
  
- **Cookies en production** :
  - Les cookies doivent avoir le même domaine que l'application
  - Vérifier qu'aucun proxy ne modifie les en-têtes de cookies
  - Vérifier que les cookies ne sont pas bloqués par le navigateur

## Dépannage

### Les cookies ne sont pas créés

1. Vérifier que `AUTH_URL` est correctement défini
2. Vérifier que `AUTH_SECRET` est défini
3. Vérifier que `AUTH_TRUST_HOST=true` est défini
4. Vérifier les logs du serveur pour les erreurs

### Les cookies sont créés mais la session n'est pas persistée

1. Vérifier que le middleware utilise la même configuration que `auth.ts`
2. Vérifier que les cookies ne sont pas supprimés par un proxy
3. Vérifier que le domaine des cookies correspond à l'URL de l'application
4. Tester avec un autre navigateur

### Redirection infinie vers login

1. Vérifier que `/auth/signin` est dans `authRoutes` dans `routes.ts`
2. Vérifier que les routes publiques sont correctement configurées
3. Vérifier que le middleware ne bloque pas les routes d'authentification

## Migration vers HTTPS

Si vous migrez vers HTTPS plus tard :

1. Mettre à jour `AUTH_URL` pour utiliser `https://`
2. Les cookies sécurisés seront automatiquement activés
3. Redémarrer l'application
4. Les utilisateurs devront se reconnecter (les cookies HTTP ne fonctionneront plus)

