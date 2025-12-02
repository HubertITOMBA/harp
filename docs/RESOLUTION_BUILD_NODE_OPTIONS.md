# Résolution du problème `--r= is not allowed in NODE_OPTIONS`

## Problème

Lors du build Next.js en production, l'erreur suivante apparaît :
```
/home/psadm/.nvm/versions/node/v22.13.0/bin/node: --r= is not allowed in NODE_OPTIONS
Next.js build worker exited with code: 9 and signal: null
```

## Cause

Cette erreur se produit lorsque `NODE_OPTIONS` contient une option mal formatée (probablement injectée par Dynatrace ou un autre agent de monitoring). L'option `--r=` n'est pas valide pour Node.js.

## Solution immédiate

### Option 1 : Utiliser le script de build (Recommandé)

Le script `build.sh` a été amélioré pour supprimer complètement `NODE_OPTIONS` :

```bash
npm run build
```

Ce script :
- Supprime explicitement toutes les variables Dynatrace
- Crée un environnement vierge
- Utilise `env -u NODE_OPTIONS` pour s'assurer que la variable n'est pas définie

### Option 2 : Build manuel avec environnement propre

Si le script ne fonctionne pas, exécutez manuellement :

```bash
# 1. Supprimer toutes les variables Dynatrace
unset NODE_OPTIONS
unset DT_DISABLE_INJECTION
unset DT_NODE_AGENT
unset DT_AGENT_NAME
unset DT_AGENT_PATH

# 2. Vérifier que NODE_OPTIONS est bien supprimé
echo "NODE_OPTIONS: [${NODE_OPTIONS:-vide}]"

# 3. Générer Prisma sans NODE_OPTIONS
env -u NODE_OPTIONS npx prisma generate

# 4. Build Next.js sans NODE_OPTIONS
env -u NODE_OPTIONS npx next build
```

### Option 3 : Script de build alternatif

Si les solutions précédentes ne fonctionnent pas :

```bash
npm run build:alt
```

## Diagnostic

Pour diagnostiquer le problème, utilisez le script de diagnostic :

```bash
bash scripts/check-node-options.sh
```

Ce script affiche :
- La valeur actuelle de `NODE_OPTIONS`
- Les variables Dynatrace détectées
- Les fichiers de configuration système qui pourraient définir `NODE_OPTIONS`

## Vérification des fichiers de configuration système

Si le problème persiste, vérifiez les fichiers suivants qui pourraient définir `NODE_OPTIONS` :

```bash
# Vérifier les fichiers de configuration utilisateur
grep -r "NODE_OPTIONS" ~/.bashrc ~/.bash_profile ~/.profile 2>/dev/null

# Vérifier les fichiers de configuration système
grep -r "NODE_OPTIONS" /etc/profile /etc/bash.bashrc 2>/dev/null
```

Si vous trouvez `NODE_OPTIONS` dans ces fichiers, commentez ou supprimez la ligne.

## Solution permanente

Pour éviter ce problème à l'avenir, vous pouvez :

1. **Désactiver Dynatrace pour le build** (si possible)
2. **Créer un alias dans `.bashrc`** :
   ```bash
   alias build-harp='unset NODE_OPTIONS && npm run build'
   ```
3. **Utiliser un conteneur Docker** pour isoler l'environnement de build

## Notes importantes

- Les scripts de build suppriment `NODE_OPTIONS` uniquement pour le processus de build
- Après le build, `NODE_OPTIONS` peut être réinjecté par Dynatrace (c'est normal pour l'exécution)
- Le script `build.sh` est automatiquement utilisé par `npm run build`
- Si vous obtenez "Permission denied", exécutez `chmod +x scripts/*.sh` sur le serveur Linux

## Scripts disponibles

- `npm run build` : Build standard avec environnement vierge (recommandé)
- `npm run build:alt` : Build alternatif avec environnement complètement propre
- `npm run build:internal` : Build avec NODE_OPTIONS vide
- `npm run build:direct` : Build direct avec environnement isolé

