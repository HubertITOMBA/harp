# 404 qui persiste en production sans proxy

Si, après avoir suivi [TROUBLESHOOTING_RSC_404.md](./TROUBLESHOOTING_RSC_404.md) (section « Production sans reverse proxy »), vous avez toujours des 404 ou « An unexpected response was received from the server » :

## 1. Vérifier que le build n'a pas figé localhost

Les variables `NEXT_PUBLIC_*` sont injectées **au moment du build**. Si `.env.production` contenait encore `NEXT_PUBLIC_SERVER_URL=http://localhost:9352` lors du dernier `npm run build`, le JS livré part vers localhost.

- **À faire** : Ouvrir `.env.production` et soit **supprimer** la ligne `NEXT_PUBLIC_SERVER_URL=...` (recommandé pour accès par IP), soit la remplacer par l'URL réelle (ex. `NEXT_PUBLIC_SERVER_URL=http://10.173.8.125:9352`).
- Ensuite **obligatoire** : supprimer le cache de build puis rebuilder :
  ```bash
  rm -rf .next
  npm run build
  ```

## 2. Vérifier qu'aucune URL localhost n'est dans le build

Après un build propre, vous pouvez vérifier que le bundle ne contient plus d'URL absolue vers localhost :

```powershell
# Windows PowerShell
Select-String -Path ".next\static\chunks\*.js" -Pattern "localhost:9352" -List | Select-Object -First 5
```

Si des fichiers sont listés et que vous n'avez pas mis localhost dans `.env.production`, refaire un build après avoir retiré `NEXT_PUBLIC_SERVER_URL`.

## 3. Vérifier dans le navigateur

1. Ouvrir l'app avec l'URL réelle (ex. `http://10.173.8.125:9352`).
2. F12 → onglet **Réseau (Network)**.
3. Recharger la page, puis cliquer sur un lien (ex. vers `/admin`).
4. Regarder l'**URL demandée** des requêtes en échec (404) :
   - si l'URL commence par `http://localhost:9352/...` → le build a encore figé localhost : refaire l'étape 1.
   - si l'URL est relative (ex. `/admin?_rsc=...`) ou utilise `http://10.173.8.125:9352` → le problème vient d'ailleurs (serveur, route, auth).

## 4. Résumé des variables pour « production sans proxy »

| Variable | Valeur recommandée (accès par IP) |
|----------|------------------------------------|
| `AUTH_URL` | `http://10.173.8.125:9352` (ou l'URL réelle) |
| `NEXTAUTH_URL` | Idem |
| `NEXT_PUBLIC_SERVER_URL` | **Non définie** (URLs relatives) ou `http://10.173.8.125:9352` |
| `AUTH_TRUST_HOST` | `true` |

Après toute modification de `NEXT_PUBLIC_*`, un **nouveau build** (`rm -rf .next` puis `npm run build`) est nécessaire.
