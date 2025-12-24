# Dépannage : Erreurs 404 sur les routes RSC

## Symptômes

En production, vous voyez des erreurs comme :
```
:9352/harp/envs?_rsc=1s9fk:1   Failed to load resource: the server responded with a status of 404 (Not Found)
:9352/list/tpstatus?_rsc=17hqa:1   Failed to load resource: the server responded with a status of 404 (Not Found)
:9352/profile?_rsc=17hqa:1   Failed to load resource: the server responded with a status of 404 (Not Found)
```

Et chaque clic redirige vers la page de login.

## Cause

Le build a été fait **sans** la variable `NEXT_PUBLIC_SERVER_URL` définie, ou avec une valeur incorrecte. Next.js génère alors des URLs relatives (`:9352/...`) au lieu d'URLs absolues (`https://localhost:9352/...`).

## Solution : Rebuild avec les bonnes variables

### ⚡ Solution rapide (recommandée)

Utilisez le script de rebuild automatique :

```bash
npm run rebuild:production
```

Ce script :
- ✅ Vérifie que toutes les variables d'environnement sont définies
- ✅ Supprime automatiquement le dossier `.next`
- ✅ Rebuild avec les bonnes variables
- ✅ Vérifie que le build utilise les bonnes URLs

### Solution manuelle

Si vous préférez faire le rebuild manuellement :

### Étape 1 : Vérifier le fichier `.env`

Assurez-vous que votre fichier `.env` contient :

```env
# HTTPS activé (certificats installés)
AUTH_URL=https://localhost:9352
NEXT_PUBLIC_SERVER_URL=https://localhost:9352
AUTH_TRUST_HOST=true
AUTH_SECRET=votre-secret-très-long-et-aléatoire
```

### Étape 2 : Vérifier que les variables sont chargées

**Sur Linux/Mac** :
```bash
# Vérifier les variables
echo $AUTH_URL
echo $NEXT_PUBLIC_SERVER_URL

# Si elles ne sont pas définies, les charger depuis .env
# Option 1 : Utiliser le script (recommandé)
chmod +x scripts/load-env.sh
source scripts/load-env.sh

# Option 2 : Méthode manuelle (si le script ne fonctionne pas)
set -a
source <(cat .env | grep -v '^#' | sed 's/^/export /')
set +a
```

**Sur Windows (PowerShell)** :
```powershell
# Vérifier les variables
$env:AUTH_URL
$env:NEXT_PUBLIC_SERVER_URL

# Si elles ne sont pas définies, les charger depuis .env
# Option 1 : Utiliser le script (recommandé)
.\scripts\load-env.ps1

# Option 2 : Méthode manuelle (si le script ne fonctionne pas)
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Supprimer les guillemets si présents
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}
```

### Étape 3 : Nettoyer et rebuild

**IMPORTANT** : Vous devez supprimer le dossier `.next` avant de rebuild pour forcer Next.js à régénérer toutes les URLs.

```bash
# Supprimer le build précédent
rm -rf .next

# Rebuild avec les variables définies
npm run build
```

**Sur Windows (PowerShell)** :
```powershell
# Supprimer le build précédent
Remove-Item -Recurse -Force .next

# Rebuild avec les variables définies
npm run build
```

### Étape 4 : Vérifier le build

Après le build, vérifiez que les URLs sont correctes :

```bash
# Chercher les URLs dans les fichiers générés
grep -r "localhost:9352" .next/server/app-paths-manifest.json
# ou
grep -r "https://" .next/server/app-paths-manifest.json
```

Si vous ne trouvez pas `https://localhost:9352` dans les fichiers, le build n'a pas utilisé les bonnes variables.

### Étape 5 : Redémarrer l'application

```bash
# Arrêter l'application
pm2 stop harp
# ou
systemctl stop harp

# Redémarrer
pm2 start harp
# ou
systemctl start harp
```

## Vérification dans le navigateur

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Vérifier que les requêtes RSC utilisent `https://localhost:9352` et non `:9352`

## Si le problème persiste

### Option 1 : Build avec variables explicites

**Sur Linux/Mac** :
```bash
rm -rf .next
export AUTH_URL="https://localhost:9352"
export NEXT_PUBLIC_SERVER_URL="https://localhost:9352"
export AUTH_TRUST_HOST="true"
npm run build
```

**Sur Windows (PowerShell)** :
```powershell
Remove-Item -Recurse -Force .next
$env:AUTH_URL="https://localhost:9352"
$env:NEXT_PUBLIC_SERVER_URL="https://localhost:9352"
$env:AUTH_TRUST_HOST="true"
npm run build
```

### Option 2 : Utiliser .env.production

Créez un fichier `.env.production` à la racine du projet :

```env
AUTH_URL=https://localhost:9352
NEXT_PUBLIC_SERVER_URL=https://localhost:9352
AUTH_TRUST_HOST=true
AUTH_SECRET=votre-secret-très-long-et-aléatoire
```

Puis rebuild :
```bash
rm -rf .next
npm run build
```

Next.js chargera automatiquement `.env.production` lors du build en production.

### Option 3 : Vérifier NODE_ENV

Assurez-vous que `NODE_ENV=production` est défini lors du build :

```bash
NODE_ENV=production npm run build
```

## Checklist de vérification

- [ ] Le fichier `.env` contient `NEXT_PUBLIC_SERVER_URL=https://localhost:9352`
- [ ] Les variables sont chargées dans l'environnement avant le build
- [ ] Le dossier `.next` a été supprimé avant le rebuild
- [ ] Le build a été fait avec `npm run build`
- [ ] Les fichiers générés contiennent `https://localhost:9352`
- [ ] L'application a été redémarrée après le build
- [ ] Le navigateur utilise des URLs absolues (vérifier dans la console)

## Notes importantes

- **Les variables `NEXT_PUBLIC_*` sont "baked" dans le build** : elles doivent être définies au moment du build, pas seulement au runtime
- **Un simple redémarrage ne suffit pas** : si le build a été fait avec de mauvaises variables, il faut rebuild
- **Supprimer `.next` est essentiel** : cela force Next.js à régénérer toutes les URLs
- **Vérifier dans le navigateur** : les URLs doivent être absolues (`https://...`) et non relatives (`:9352/...`)

