# Dépannage : Port 9352 déjà utilisé

## Problème

Lorsque vous lancez `npm run start`, vous obtenez une erreur indiquant que le port 9352 est déjà utilisé :

```
Error: Port 9352 is already in use
```

## Cause

Un autre processus (autre instance de Next.js, autre application, ou ancien processus non terminé) utilise déjà le port 9352.

### Causes possibles

1. **Une autre instance de l'application** tourne déjà (double clic, terminal resté ouvert).
2. **Variable d'environnement `PORT`** dans `.env` ou `.env.production` qui pointe vers un port déjà pris.
3. **Processus zombie** d'un précédent `npm run start` ou `npm run dev`.

## Solution

### ✅ Solution 1 : Arrêter l'autre processus

Sous Linux / WSL :

```bash
# Trouver le processus qui utilise le port 9352
lsof -i :9352
# ou
ss -tlnp | grep 9352
netstat -tlnp | grep 9352

# Arrêter le processus (remplacer PID par l'identifiant affiché)
kill PID
```

Sous Windows (PowerShell) :

```powershell
netstat -ano | findstr :9352
taskkill /PID <PID> /F
```

### ✅ Solution 2 : Vérifier `.env` et `.env.production`

Assurez-vous de ne pas avoir `PORT` défini sur une valeur déjà utilisée. Pour HARP, le port est **9352** partout :

```env
# Optionnel : expliciter le port (cohérent avec next start -p 9352)
# PORT=9352

# URLs avec le port 9352
AUTH_URL=http://votre-serveur:9352
NEXT_PUBLIC_SERVER_URL=http://votre-serveur:9352
```

### ✅ Solution 3 : Vérifier `package.json`

Le script de démarrage doit lancer Next.js sur le port 9352 :

```json
{
  "scripts": {
    "start": "next start -p 9352"
  }
}
```

## Résumé

- **Port 9352** : utilisé par l'application HARP (dev et production).
- **Variables d'environnement** : `AUTH_URL`, `NEXT_PUBLIC_SERVER_URL` doivent utiliser le port **9352** (ex. `http://host:9352`).
