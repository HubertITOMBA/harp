# Configuration HTTP uniquement

L'application HARP est configurée pour **n'utiliser que le protocole HTTP** (pas de HTTPS). Ce document décrit cette configuration et comment la maintenir en développement et en production.

---

## Choix technique

- **Protocole** : HTTP uniquement.
- **Cookies de session** : cookies non sécurisés (`useSecureCookies: false`) pour être compatibles avec HTTP.
- Les cookies sécurisés ne sont activés **que** si `AUTH_URL` commence explicitement par `https://` (cas non utilisé actuellement).

---

## Variables d'environnement

### En développement (`.env`)

Utilisez des **valeurs sans guillemets** pour les URLs (évite l’erreur `Invalid URL` si le parseur inclut les guillemets) :

```env
# Auth : HTTP uniquement (pas de HTTPS)
AUTH_URL=http://localhost:9352

# URLs internes et publiques (HTTP)
NEXTAUTH_URL_INTERNAL=http://localhost:9352
NEXT_PUBLIC_SERVER_URL=http://localhost:9352

# Requis pour NextAuth
AUTH_TRUST_HOST=true
```

### En production

Utilisez les mêmes noms de variables avec l’URL HTTP réelle du serveur (sans guillemets) :

```env
AUTH_URL=http://votre-serveur:9352
# ou avec nom d’hôte
# AUTH_URL=http://portails.orange-harp.fr:9352

NEXTAUTH_URL_INTERNAL=http://portails.orange-harp.fr:9352
NEXT_PUBLIC_SERVER_URL=http://portails.orange-harp.fr:9352

AUTH_TRUST_HOST=true
```

**Règles :**

- Toutes les URLs doivent commencer par `http://` (jamais `https://`).
- Même hôte et même port pour `AUTH_URL`, `NEXTAUTH_URL_INTERNAL` et `NEXT_PUBLIC_SERVER_URL` (sauf cas particulier documenté).

---

## Implémentation dans le code

### 1. Cookies de session (NextAuth)

La valeur `useSecureCookies` est dérivée de `AUTH_URL` :

- Si `AUTH_URL` commence par `https://` → `useSecureCookies: true` (cookies sécurisés).
- Sinon (HTTP ou variable absente) → `useSecureCookies: false` (cookies compatibles HTTP).

**Fichiers concernés :**

- `auth.ts` (configuration NextAuth)
- `middleware.ts` (configuration utilisée par le middleware NextAuth)

Extrait typique :

```ts
// Cookies sécurisés uniquement si AUTH_URL est en https (sinon false pour HTTP)
useSecureCookies: process.env.AUTH_URL?.startsWith('https://') ?? false,
```

En ne définissant **jamais** `AUTH_URL` avec une URL `https://`, on reste en HTTP avec des cookies non sécurisés.

### 2. Fichiers modifiés pour HTTP uniquement

| Fichier        | Rôle |
|----------------|------|
| `auth.ts`      | `useSecureCookies` à `false` par défaut (si pas de `https://` dans `AUTH_URL`) |
| `middleware.ts`| Même logique pour la config NextAuth du middleware |
| `.env`         | `AUTH_URL` et les autres URLs en `http://` |

---

## Vérification rapide

1. **Variables**  
   Vérifier qu’aucune des URLs d’auth/serveur ne commence par `https://` :
   - `AUTH_URL`
   - `NEXTAUTH_URL_INTERNAL`
   - `NEXT_PUBLIC_SERVER_URL`

2. **Comportement**  
   En lançant l’app et en se connectant, la session doit persister en accédant au site en `http://` (pas de redirection vers HTTPS, pas de perte de session liée aux cookies sécurisés).

3. **Build**  
   Pour la production, définir `NEXT_PUBLIC_SERVER_URL` (et les autres) **avant** le build, puis redémarrer l’application après toute modification de `.env`.

---

## Dépannage : clic sur Paramètres (ou autre lien) redirige vers / en production

**Symptôme** : En développement, le menu « Paramètres » mène bien vers `/settings`. En production, un clic sur Paramètres (ou d’autres liens protégés) envoie vers `/` puis plus rien ne semble fonctionner.

**Cause** : Le middleware considère l’utilisateur comme non connecté (`req.auth` null) sur la requête vers `/settings`. Les pages protégées redirigent donc vers la page de connexion (avec `callbackUrl` pour revenir à la page demandée après login).

**À vérifier en production :**

1. **`AUTH_URL` doit être exactement l’URL utilisée dans le navigateur**  
   Même schéma, même hôte, même port.  
   Exemple : si l’accès se fait via `http://portails.orange-harp.fr:9352`, alors :
   ```env
   AUTH_URL=http://portails.orange-harp.fr:9352
   ```
   Si `AUTH_URL` est absent ou pointe vers `localhost` / un autre domaine, le cookie de session peut être mal géré et le middleware ne verra pas la session.

2. **Cookies**  
   - `useSecureCookies` doit rester à `false` (pas de `https://` dans `AUTH_URL`).  
   - Dans les DevTools du navigateur (Application → Cookies), vérifier qu’un cookie de session NextAuth est bien présent pour le domaine du site après connexion (nom du type `authjs.session-token` ou similaire).

3. **Reverse proxy**  
   Si un proxy (Apache, nginx, etc.) est devant l’app, il doit transmettre l’en-tête `Host` et ne pas supprimer les cookies.

4. **Comportement actuel**  
   Si la session n’est pas reconnue, l’utilisateur est redirigé vers `/login?callbackUrl=/settings` (ou la page demandée). Après connexion, il est renvoyé sur cette page. Si la perte de session se répète à chaque navigation, corriger `AUTH_URL` et les cookies comme ci‑dessus.

5. **Session perdue à chaque clic de menu (production)**  
   Le middleware utilise un fallback avec `getToken` (next-auth/jwt) quand `req.auth` est null : la session est lue depuis le cookie JWT avec `secureCookie: false` (HTTP). S'assurer que **`AUTH_SECRET`** est défini en production. Si le problème continue, vérifier `AUTH_URL` et les cookies comme au point 1.

---

## Dépannage : erreur CORS sur la déconnexion (logout)

**Symptôme** : En production, quand l'utilisateur clique sur « Déconnexion », le navigateur affiche une erreur du type :

- `Access to fetch at 'http://localhost:9352/' (redirected from 'http://172.24.250.48:9352/logout?...') from origin 'http://172.24.250.48:9352' has been blocked by CORS policy`
- `Failed to fetch RSC payload for http://.../logout. Falling back to browser navigation. TypeError: Failed to fetch`

**Cause** : NextAuth utilise **`AUTH_URL`** pour construire l’URL de redirection après `signOut()`. Si en production `AUTH_URL` est restée à `http://localhost:9352` alors que l’utilisateur accède au site via une autre origine (ex. `http://172.24.250.48:9352`), le serveur renvoie une redirection vers `http://localhost:9352/`. Le navigateur suit cette redirection : la requête part d’une origine (172.24.250.48) et aboutit sur une autre (localhost) → CORS bloque la réponse.

**Correctif appliqué dans le code** (`app/logout/route.ts`) :

- Appel à **`signOut({ redirect: false })`** pour que NextAuth nettoie la session (cookie) sans effectuer elle‑même la redirection (évite d’utiliser `AUTH_URL` pour la cible).
- Redirection vers **l’origine côté client** : utilisation des en-têtes **`Host`** ou **`X-Forwarded-Host`** (et `X-Forwarded-Proto`) pour construire l’URL de redirection, au lieu de `request.url` qui peut être `localhost` côté serveur. Ainsi la réponse envoie bien `Location: http://10.173.8.125:9352/login` (ou l’IP/hôte utilisé par le navigateur), ce qui évite `localhost:9352/login` et l’erreur **ERR_CONNECTION_REFUSED**.

La déconnexion redirige donc vers `/login` sur l’hôte visible par le client, sans CORS ni connexion refusée.

**Recommandation en production** : Dans le `.env` (ou `.env.production`) du serveur, définir **toutes** les URLs avec l’URL réelle d’accès (même hôte et port que dans la barre d’adresse), par exemple pour `http://10.173.8.125:9352` :

```env
AUTH_URL=http://10.173.8.125:9352
NEXTAUTH_URL=http://10.173.8.125:9352
NEXT_PUBLIC_SERVER_URL=http://10.173.8.125:9352
NEXTAUTH_URL_INTERNAL=http://10.173.8.125:9352
```

- **`NEXT_PUBLIC_SERVER_URL`** ne doit pas rester vide en production : les variables `NEXT_PUBLIC_*` sont figées au **build**. Si elle était vide au build, ajouter la valeur dans le `.env`, puis **refaire un build** (`npm run build`) avant de redémarrer.
- Cela évite redirections vers localhost, erreurs CORS et problèmes de session.

---

## Références

- **URLs en production** : `docs/CONFIGURATION_PRODUCTION_URLS.md`
- **Création / contenu du `.env`** : `docs/CREATION_FICHIER_ENV.md`
- **Session et auth** : `docs/CONFIGURATION_SESSION_PRODUCTION.md`
