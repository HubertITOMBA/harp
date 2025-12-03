# Solution Dynatrace : Workaround OneAgent 1.323+

## Contexte

D'après la réponse de Dynatrace, le problème `--r= is not allowed in NODE_OPTIONS` est dû à un bug dans Next.js qui modifie les arguments de ligne de commande en une séquence invalide. L'option `-r` est introduite par l'injection OneAgent avec une valeur valide, mais Next.js post-traitement la modifie en `--r=` (invalide).

## Solution proposée par Dynatrace

Dynatrace a un **workaround disponible avec OneAgent 1.323+** où l'injection utilise `--require` au lieu de `-r`.

### Références

- **Issue Next.js** : https://github.com/vercel/next.js/issues/77550
- **Workaround Dynatrace** : OneAgent 1.323+ avec injection via `--require`

## Action requise : Mise à jour de OneAgent

### Vérification de la version actuelle

Pour vérifier la version de OneAgent installée sur le serveur :

```bash
# Méthode 1 : Via le service
systemctl status dynatrace-oneagent

# Méthode 2 : Via les fichiers de l'agent
cat /opt/dynatrace/oneagent/agent/version.txt 2>/dev/null || \
cat /opt/dynatrace/oneagent/agent/version 2>/dev/null || \
ls -la /opt/dynatrace/oneagent/agent/ | grep -i version

# Méthode 3 : Via les logs
journalctl -u dynatrace-oneagent | grep -i version | tail -5

# Méthode 4 : Via le binaire
/opt/dynatrace/oneagent/agent/bin/oneagent --version 2>/dev/null || \
/opt/dynatrace/oneagent/agent/bin/oneagent -v 2>/dev/null
```

### Mise à jour vers OneAgent 1.323+

Si la version est inférieure à 1.323, il faut mettre à jour OneAgent :

1. **Contacter l'équipe infrastructure** pour mettre à jour Dynatrace OneAgent vers la version 1.323 ou supérieure
2. **Vérifier la configuration** pour s'assurer que l'injection utilise `--require` au lieu de `-r`

### Vérification après mise à jour

Après la mise à jour, vérifier que l'injection utilise bien `--require` :

```bash
# Vérifier NODE_OPTIONS
echo "NODE_OPTIONS: [$NODE_OPTIONS]"

# Si la version est >= 1.323, NODE_OPTIONS devrait contenir --require au lieu de -r
# Exemple attendu :
# NODE_OPTIONS = --require /opt/dynatrace/oneagent/agent/bin/.../pl-nodejsagent.js
```

## Test du build après mise à jour

Une fois OneAgent mis à jour vers 1.323+, tester le build :

```bash
# Test 1 : Build standard
npm run build

# Test 2 : Vérifier que NODE_OPTIONS contient --require
echo "NODE_OPTIONS: [$NODE_OPTIONS]"

# Test 3 : Si le build échoue encore, essayer avec les scripts existants
npm run build:no-dynatrace
```

## Si la mise à jour n'est pas possible immédiatement

En attendant la mise à jour de OneAgent, continuer à utiliser les scripts de build existants qui tentent de contourner le problème :

```bash
# Scripts disponibles
npm run build              # Build avec environnement vierge
npm run build:no-dynatrace # Build avec Dynatrace désactivé
npm run build:ultra        # Build ultra-propre
npm run build:final        # Build avec wrapper node
```

## Informations pour l'équipe infrastructure

### Demande de mise à jour

**Priorité** : Haute (bloque le build en production)

**Action requise** :
1. Vérifier la version actuelle de OneAgent sur le serveur de production
2. Mettre à jour OneAgent vers la version 1.323 ou supérieure
3. Vérifier que l'injection utilise `--require` au lieu de `-r`
4. Tester le build Next.js après la mise à jour

### Informations techniques

- **Serveur** : Serveur de production Linux
- **Utilisateur** : psadm
- **Répertoire** : `/produits/portail_harp-tech/www/`
- **Node.js** : v22.13.0 (via nvm)
- **Next.js** : 15.5.6
- **Problème** : `--r= is not allowed in NODE_OPTIONS`
- **Solution** : OneAgent 1.323+ avec injection via `--require`

### Références Dynatrace

- **Workaround** : OneAgent 1.323+ utilise `--require` au lieu de `-r`
- **Issue Next.js** : https://github.com/vercel/next.js/issues/77550
- **Cause** : Next.js modifie les arguments de ligne de commande en séquence invalide

## Notes importantes

1. **Le workaround est disponible uniquement avec OneAgent 1.323+**
2. **La mise à jour doit être effectuée par l'équipe infrastructure**
3. **Après la mise à jour, les scripts de build existants devraient fonctionner normalement**
4. **Si la mise à jour n'est pas possible, continuer à utiliser les scripts de contournement**

## Script de diagnostic

Un script de diagnostic est disponible pour vérifier la version de OneAgent :

```bash
npm run diagnostic:dynatrace
```

Ce script collecte toutes les informations nécessaires pour l'équipe infrastructure.

