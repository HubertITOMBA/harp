# Vérification du Build en Production

## Message de démarrage Next.js

Lorsque vous lancez `npm run start`, Next.js affiche :

```
▲ Next.js 15.5.7
- Local:        http://localhost:9352
- Network:      http://10.173.8.125:9352
```

**⚠️ Ce message est normal** : Il affiche l'URL locale du serveur, pas l'URL de production configurée dans `.env`.

## Vérification que le build utilise les bonnes variables

### 1. Vérifier le fichier `.env`

Assurez-vous que votre `.env` contient :

```env
AUTH_URL=https://portails.orange-harp.fr:9352
NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9352
AUTH_TRUST_HOST=true
AUTH_SECRET=votre-secret
```

### 2. Vérifier que le build a été fait avec ces variables

**Option A : Utiliser le script de rebuild automatique** (recommandé) :

```bash
npm run rebuild:production
```

**Option B : Vérifier manuellement** :

```bash
# Vérifier que les variables sont chargées
echo $NEXT_PUBLIC_SERVER_URL
# Doit afficher : https://portails.orange-harp.fr:9352

# Si ce n'est pas le cas, charger depuis .env
export $(cat .env | grep -v '^#' | xargs)

# Supprimer le build précédent
rm -rf .next

# Rebuild
npm run build
```

### 3. Vérifier dans les fichiers générés

Après le build, vérifiez que les URLs sont correctes :

```bash
# Chercher l'URL de production dans les fichiers générés
grep -r "portails.orange-harp.fr" .next/server/app-paths-manifest.json

# Ou vérifier qu'il n'y a pas de localhost
grep -r "localhost:9352" .next/server/app-paths-manifest.json
# Ne doit rien retourner (ou seulement dans les commentaires)
```

### 4. Vérifier dans le navigateur

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. Chercher les requêtes RSC (filtre : `_rsc`)

**✅ Correct** : Les requêtes doivent utiliser `https://portails.orange-harp.fr:9352/...?_rsc=...`

**❌ Incorrect** : Les requêtes utilisent `:9352/...?_rsc=...` (URL relative)

## Diagnostic

### Si les URLs sont encore relatives (`:9352/...`)

Cela signifie que le build n'a pas été fait avec les bonnes variables. Solutions :

1. **Vérifier que `.env` existe et contient les bonnes valeurs**
2. **Vérifier que les variables sont chargées avant le build** :
   ```bash
   # Sur Linux/Mac
   export $(cat .env | grep -v '^#' | xargs)
   echo $NEXT_PUBLIC_SERVER_URL
   
   # Sur Windows PowerShell
   Get-Content .env | ForEach-Object {
       if ($_ -match '^([^=]+)=(.*)$') {
           [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
       }
   }
   $env:NEXT_PUBLIC_SERVER_URL
   ```

3. **Supprimer `.next` et rebuild** :
   ```bash
   rm -rf .next
   npm run build
   ```

4. **Utiliser le script automatique** :
   ```bash
   npm run rebuild:production
   ```

### Si les URLs sont absolues mais utilisent HTTP au lieu de HTTPS

Vérifiez que votre `.env` utilise bien `https://` :

```env
AUTH_URL=https://portails.orange-harp.fr:9352
NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9352
```

Puis rebuild.

## Checklist de vérification

- [ ] Le fichier `.env` existe et contient `NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9352`
- [ ] Les variables sont chargées dans l'environnement (vérifier avec `echo $NEXT_PUBLIC_SERVER_URL`)
- [ ] Le dossier `.next` a été supprimé avant le rebuild
- [ ] Le build a été fait avec `npm run build` ou `npm run rebuild:production`
- [ ] Les fichiers générés contiennent `https://portails.orange-harp.fr:9352`
- [ ] Dans le navigateur, les requêtes RSC utilisent des URLs absolues avec HTTPS
- [ ] Il n'y a plus d'erreurs 404 sur les routes RSC

## Notes importantes

- **Le message de démarrage Next.js** (`Local: http://localhost:9352`) est normal et n'indique pas un problème
- **Les variables `NEXT_PUBLIC_*` sont "baked" dans le build** : elles doivent être définies au moment du build
- **Un simple redémarrage ne suffit pas** : si le build a été fait avec de mauvaises variables, il faut rebuild
- **Vérifier dans le navigateur** : c'est la seule vraie vérification que les URLs sont correctes

