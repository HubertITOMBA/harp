# Résolution du problème de build avec Dynatrace

## Problème

Lors du build sur le serveur Linux, l'erreur suivante apparaît :
```
NODE_OPTIONS = -r /opt/dynatrace/oneagent/agent/bin/.../pl-nodejsagent.js
/home/psadm/.nvm/versions/node/v22.13.0/bin/node: --r= is not allowed in NODE_OPTIONS
Next.js build worker exited with code: 9
```

### Cause

D'après la réponse de Dynatrace, le problème est dû à un **bug dans Next.js** qui modifie les arguments de ligne de commande en une séquence invalide. L'option `-r` est introduite par l'injection OneAgent avec une valeur valide, mais Next.js post-traitement la modifie en `--r=` (invalide).

**Référence Next.js** : https://github.com/vercel/next.js/issues/77550

## Solutions

### ⭐ Solution 0 : Mettre à jour OneAgent vers 1.323+ (Solution recommandée par Dynatrace)

**Cette est la solution recommandée par Dynatrace** : Mettre à jour OneAgent vers la version 1.323 ou supérieure, qui utilise `--require` au lieu de `-r`, évitant ainsi le problème de modification des arguments par Next.js.

Voir le document `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` pour les détails complets.

**Action requise** : Contacter l'équipe infrastructure pour mettre à jour OneAgent vers 1.323+.

### Solution 1 : Script de build standard (Workaround temporaire)

Utilisez le script de build standard qui crée un environnement complètement vierge :

```bash
npm run build
```

Ce script utilise `scripts/build.sh` qui :
- Crée un environnement complètement vierge avec `env -i`
- Ne garde que les variables essentielles (PATH, HOME, USER, etc.)
- Force `NODE_OPTIONS=""` explicitement
- Vérifie que la variable est bien vide avant le build
- Exécute chaque commande avec `NODE_OPTIONS=""` pour garantir un environnement propre

### Solution 2 : Build avec environnement complètement propre

Si la solution 1 ne fonctionne pas, utilisez un environnement complètement vierge :

```bash
npm run build:clean
```

Ce script crée un environnement complètement propre avec seulement les variables essentielles (PATH, HOME, etc.).

### Solution 3 : Build alternatif inline

Si les scripts ne fonctionnent pas, utilisez la commande inline :

```bash
npm run build:alt
```

### Solution 4 : Commande manuelle

Si toutes les solutions précédentes échouent, exécutez manuellement :

```bash
# Supprimer toutes les variables Dynatrace
unset NODE_OPTIONS
unset DT_DISABLE_INJECTION
unset DT_NODE_AGENT
unset DT_AGENT_NAME
unset DT_AGENT_PATH

# Forcer NODE_OPTIONS à être vide
export NODE_OPTIONS=""

# Vérifier que c'est bien vide
echo "NODE_OPTIONS: $NODE_OPTIONS"  # Doit être vide

# Exécuter le build
npx prisma generate
NODE_OPTIONS="" next build
```

## Vérification

Pour vérifier que `NODE_OPTIONS` est bien supprimé avant le build :

```bash
# Vérifier la valeur actuelle
echo $NODE_OPTIONS

# Si elle contient encore Dynatrace, la supprimer
unset NODE_OPTIONS
export NODE_OPTIONS=""
```

## Dépannage

### Le problème persiste même après avoir supprimé NODE_OPTIONS

1. **Vérifier les fichiers de configuration système** :
   ```bash
   # Vérifier .bashrc, .bash_profile, .profile
   grep -r "NODE_OPTIONS" ~/.bashrc ~/.bash_profile ~/.profile /etc/profile 2>/dev/null
   ```

2. **Vérifier les variables d'environnement globales** :
   ```bash
   env | grep -i node
   env | grep -i dynatrace
   ```

3. **Utiliser un environnement complètement isolé** :
   ```bash
   # Créer un script temporaire
   cat > /tmp/build-clean.sh << 'EOF'
   #!/bin/bash
   env -i PATH="$PATH" HOME="$HOME" USER="$USER" PWD="$PWD" \
       bash -c 'cd /path/to/project && npm run build:internal'
   EOF
   chmod +x /tmp/build-clean.sh
   /tmp/build-clean.sh
   ```

### Dynatrace réinjecte la variable

Si Dynatrace réinjecte automatiquement la variable (via un agent système), vous pouvez :

1. **Désactiver temporairement l'agent Dynatrace** pour le build
2. **Utiliser un conteneur Docker** isolé pour le build
3. **Configurer Dynatrace** pour exclure le processus de build

## Installation des scripts

Sur le serveur Linux, assurez-vous que les scripts sont exécutables :

```bash
chmod +x scripts/build.sh
chmod +x scripts/build-clean.sh
```

## Notes importantes

- Les scripts de build suppriment `NODE_OPTIONS` uniquement pour le processus de build
- Après le build, `NODE_OPTIONS` peut être réinjecté par Dynatrace (c'est normal)
- Le script `build.sh` est exécutable automatiquement par npm
- Si vous obtenez "Permission denied", exécutez `chmod +x scripts/*.sh`

## Scripts disponibles

- `npm run build` : Build standard avec environnement vierge (recommandé)
- `npm run build:alt` : Build alternatif avec environnement vierge
- `npm run build:direct` : Build direct avec environnement vierge (inline)
- `npm run build:internal` : Build interne avec NODE_OPTIONS="" (utilisé par les autres scripts)

## Si le problème persiste

Si même avec `env -i` le problème persiste, cela signifie que Dynatrace injecte la variable directement dans les processus Node.js. Dans ce cas :

1. **Vérifier où NODE_OPTIONS est défini** :
   ```bash
   # Vérifier tous les fichiers de configuration
   grep -r "NODE_OPTIONS" /etc/environment /etc/profile ~/.bashrc ~/.bash_profile ~/.profile 2>/dev/null
   
   # Vérifier les processus en cours
   ps aux | grep -i dynatrace
   ```

2. **Désactiver temporairement l'agent Dynatrace** :
   ```bash
   # Arrêter l'agent Dynatrace (si possible)
   sudo systemctl stop dynatrace-oneagent  # ou la commande appropriée
   npm run build
   sudo systemctl start dynatrace-oneagent
   ```

3. **Utiliser un conteneur Docker isolé** pour le build

4. **Modifier next.config.ts** pour désactiver les workers (solution de dernier recours)

## Solution recommandée : Mise à jour OneAgent 1.323+

**Note importante** : La solution recommandée par Dynatrace est de mettre à jour OneAgent vers la version 1.323 ou supérieure, qui utilise `--require` au lieu de `-r`. Cette solution évite complètement le problème de modification des arguments par Next.js.

Pour plus d'informations, voir :
- `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` (Solution recommandée)
- `docs/DEMANDE_INFRASTRUCTURE_DYNATRACE.md` (Demande à l'équipe infrastructure)

