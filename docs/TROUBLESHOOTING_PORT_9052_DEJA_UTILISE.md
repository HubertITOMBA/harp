# Dépannage : Port 9052 déjà utilisé

## Problème

Lorsque vous lancez `npm run start`, vous obtenez une erreur indiquant que le port 9052 est déjà utilisé :

```
Error: Port 9052 is already in use
```

## Cause

Le port 9052 est déjà utilisé par Apache (c'est normal et attendu). Le problème est que Next.js essaie aussi d'utiliser ce port au lieu du port 9352.

### Causes possibles

1. **Variable d'environnement `PORT=9052`** dans `.env.production` qui surcharge le paramètre `-p 9352`
2. **Variable d'environnement système `PORT=9052`** définie dans votre shell
3. **Configuration incorrecte** dans un script de démarrage

## Solution

### ✅ Solution 1 : Vérifier et corriger `.env.production`

Vérifiez votre fichier `.env.production` et **supprimez ou corrigez** toute ligne contenant `PORT=9052` :

```env
# ❌ À SUPPRIMER si présent
PORT=9052

# ✅ CORRECT : Ne pas définir PORT du tout, ou utiliser 9352
# PORT=9352  (optionnel, car -p 9352 est déjà dans package.json)
```

**Important** : Ne définissez PAS `PORT=9052` dans `.env.production`. Le port 9052 est réservé à Apache.

### ✅ Solution 2 : Vérifier les variables d'environnement système

Vérifiez si une variable `PORT` est définie dans votre environnement :

```bash
# Vérifier la variable PORT
echo $PORT

# Si elle affiche 9052, la supprimer
unset PORT

# Ou la définir explicitement à 9352
export PORT=9352
```

### ✅ Solution 3 : Vérifier la configuration dans `package.json`

Assurez-vous que `package.json` contient bien :

```json
{
  "scripts": {
    "start": "next start -p 9352"
  }
}
```

Le paramètre `-p 9352` force Next.js à utiliser le port 9352, mais il peut être surchargé par la variable d'environnement `PORT`.

### ✅ Solution 4 : Forcer le port dans le script de démarrage

Si le problème persiste, modifiez `package.json` pour forcer explicitement le port :

```json
{
  "scripts": {
    "start": "PORT=9352 next start -p 9352"
  }
}
```

Ou sur Windows (PowerShell) :

```json
{
  "scripts": {
    "start": "cross-env PORT=9352 next start -p 9352"
  }
}
```

## Configuration correcte

### Fichier `.env.production`

```env
# ✅ CORRECT : URLs avec le port 9052 (externe, accessible par les utilisateurs)
AUTH_URL=https://portails.orange-harp.fr:9052
NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9052
NEXT_PUBLIC_BASE_URL=https://portails.orange-harp.fr:9052

# ❌ NE PAS définir PORT=9052 ici
# Le port 9052 est réservé à Apache

# ✅ Optionnel : Définir PORT=9352 si nécessaire
# PORT=9352

AUTH_TRUST_HOST=true
```

### Architecture correcte

```
┌─────────────────────────────────────────┐
│  Apache                                 │
│  Port 9052 (externe) ✅ DÉJÀ UTILISÉ    │
│  → Reverse proxy vers localhost:9352   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js                                 │
│  Port 9352 (interne) ✅ DOIT UTILISER    │
│  Écoute sur localhost:9352              │
└─────────────────────────────────────────┘
```

## Vérification

### 1. Vérifier qu'Apache utilise le port 9052

```bash
netstat -tlnp | grep 9052
# ou
ss -tlnp | grep 9052
```

Vous devriez voir Apache écouter sur le port 9052 (c'est normal).

### 2. Vérifier que Next.js utilise le port 9352

```bash
netstat -tlnp | grep 9352
# ou
ss -tlnp | grep 9352
```

Vous devriez voir Next.js écouter sur le port 9352 (après avoir corrigé la configuration).

### 3. Vérifier qu'aucun processus n'utilise le port 9052 pour Next.js

```bash
# Vérifier les processus Node.js
ps aux | grep node

# Vérifier les ports utilisés par Node.js
lsof -i -P -n | grep node
```

Aucun processus Node.js ne devrait utiliser le port 9052.

## Résumé

- **Port 9052** : Réservé à Apache (reverse proxy) ✅
- **Port 9352** : Réservé à Next.js (application interne) ✅
- **Variable `PORT`** : Ne doit PAS être définie à 9052 dans `.env.production` ❌
- **Variables d'environnement** : `AUTH_URL`, `NEXT_PUBLIC_SERVER_URL` doivent utiliser le port 9052 (URL externe) ✅

