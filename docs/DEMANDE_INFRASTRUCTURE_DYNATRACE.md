# Demande Infrastructure : Configuration Dynatrace pour exclure le processus de build Next.js

## Contexte

L'application Next.js ne peut pas être buildée en production à cause d'une incompatibilité entre Dynatrace et le processus de build Next.js.

## Problème

Lors du build Next.js, l'erreur suivante se produit :

```
/home/psadm/.nvm/versions/node/v22.13.0/bin/node: --r= is not allowed in NODE_OPTIONS
Next.js build worker exited with code: 9 and signal: null
```

### Cause identifiée

D'après la réponse de Dynatrace, le problème est dû à un **bug dans Next.js** qui modifie les arguments de ligne de commande en une séquence invalide. L'option `-r` est introduite par l'injection OneAgent avec une valeur valide, mais Next.js post-traitement la modifie en `--r=` (invalide).

**Référence Next.js** : https://github.com/vercel/next.js/issues/77550

Dynatrace injecte automatiquement `NODE_OPTIONS` avec l'agent de monitoring :
```
NODE_OPTIONS = -r /opt/dynatrace/oneagent/agent/bin/.../pl-nodejsagent.js
```

Next.js transforme cette option en `--r=` qui n'est pas valide pour Node.js.

## Solutions déjà tentées (sans succès)

1. ✅ Suppression de `NODE_OPTIONS` via `unset` et `env -u`
2. ✅ Création d'environnements vierges avec `env -i`
3. ✅ Désactivation des workers Next.js (`workerThreads: false`, `NEXT_PRIVATE_WORKER=0`)
4. ✅ Utilisation de variables d'environnement Dynatrace (`DT_DISABLE_INJECTION=true`)
5. ✅ Création de wrappers node personnalisés
6. ✅ Modification du PATH pour intercepter les appels à node

**Aucune de ces solutions n'a fonctionné**, ce qui indique que Dynatrace injecte `NODE_OPTIONS` au niveau système (probablement via `LD_PRELOAD` ou un mécanisme similaire).

## Informations techniques

### Environnement
- **OS** : Linux (serveur de production)
- **Node.js** : v22.13.0 (via nvm)
- **Next.js** : 15.5.6
- **Utilisateur** : psadm
- **Répertoire de build** : `/produits/portail_harp-tech/www/` (ou chemin équivalent)

### Commandes de build utilisées
```bash
npm run build
# ou
npm run build:no-dynatrace
# ou
npm run build:final
```

### Processus concernés
- `node` (binaire Node.js)
- `npx` (exécuteur de paquets npm)
- `next build` (processus de build Next.js)
- Workers Next.js (processus enfants créés pendant le build)

## Demande à l'équipe infrastructure

### Option 1 : Exclure le processus de build de Dynatrace (Recommandé)

Configurer Dynatrace pour **ne pas injecter l'agent** lors du build Next.js.

**Méthodes possibles** :

1. **Exclusion par chemin d'exécution** :
   - Exclure les processus lancés depuis `/produits/portail_harp-tech/www/`
   - Exclure les processus contenant `next build` dans la commande

2. **Exclusion par variable d'environnement** :
   - Si possible, configurer Dynatrace pour respecter `DT_DISABLE_INJECTION=true`
   - Ou créer une variable d'environnement spécifique pour désactiver l'injection

3. **Exclusion par pattern de processus** :
   - Exclure les processus dont la commande contient `next build`
   - Exclure les workers Next.js (processus enfants)

### Option 2 : Désactiver temporairement Dynatrace pour le build

Si l'exclusion n'est pas possible, permettre de désactiver temporairement l'agent pour les builds :

```bash
# Arrêter l'agent avant le build
sudo systemctl stop dynatrace-oneagent
npm run build
sudo systemctl start dynatrace-oneagent
```

### Option 3 : Mettre à jour OneAgent vers 1.323+ (Recommandé par Dynatrace)

Dynatrace a un **workaround disponible avec OneAgent 1.323+** où l'injection utilise `--require` au lieu de `-r`. Cette solution évite le problème de modification des arguments par Next.js.

**Action requise** :
1. Vérifier la version actuelle de OneAgent
2. Mettre à jour vers OneAgent 1.323 ou supérieure
3. Vérifier que l'injection utilise `--require` au lieu de `-r`

Voir le document `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` pour plus de détails.

### Option 4 : Corriger le format de NODE_OPTIONS

Si Dynatrace injecte `--r=` au lieu de `-r`, corriger le format de l'injection (solution temporaire si la mise à jour n'est pas possible).

## Informations de diagnostic

### Variables d'environnement actuelles
```bash
# À exécuter sur le serveur de production
echo "NODE_OPTIONS: [$NODE_OPTIONS]"
env | grep -i DT
env | grep -i NODE
```

### Fichiers de configuration système
```bash
# Vérifier où NODE_OPTIONS est défini
grep -r "NODE_OPTIONS" /etc/environment /etc/profile ~/.bashrc ~/.bash_profile ~/.profile 2>/dev/null
```

### Processus Dynatrace
```bash
# Vérifier les processus Dynatrace actifs
ps aux | grep -i dynatrace
```

### Logs Dynatrace
```bash
# Vérifier les logs de l'agent
journalctl -u dynatrace-oneagent -n 50
# ou
tail -f /var/log/dynatrace/oneagent.log
```

## Test après configuration

Une fois la configuration effectuée, tester avec :

```bash
# 1. Vérifier que NODE_OPTIONS est vide
echo "NODE_OPTIONS: [$NODE_OPTIONS]"

# 2. Exécuter le build
npm run build

# 3. Vérifier que le build réussit
```

## Impact

- **Actuel** : Impossible de build l'application en production
- **Attendu** : Build réussi sans erreur `--r= is not allowed in NODE_OPTIONS`

## Contact

**Demandeur** : [Votre nom/équipe]  
**Date** : [Date actuelle]  
**Priorité** : Haute (bloque le déploiement en production)

## Références

- **Issue Next.js** : https://github.com/vercel/next.js/issues/77550
- **Solution Dynatrace** : OneAgent 1.323+ avec injection via `--require`
- Documentation Next.js : https://nextjs.org/docs
- Documentation Dynatrace : [Lien vers la documentation interne]
- Scripts de build disponibles dans : `scripts/build*.sh`
- Documentation complète : 
  - `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` (Solution recommandée)
  - `docs/RESOLUTION_BUILD_NODE_OPTIONS.md`
  - `docs/TROUBLESHOOTING_BUILD.md`

---

## Solution recommandée par Dynatrace

**Mise à jour OneAgent vers 1.323+** : Dynatrace a confirmé qu'un workaround est disponible avec OneAgent 1.323+ qui utilise `--require` au lieu de `-r`, évitant ainsi le problème de modification des arguments par Next.js.

Voir `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` pour les détails complets de cette solution.

**Note** : Toutes les solutions côté application ont été tentées sans succès. La solution recommandée est la mise à jour de OneAgent vers 1.323+ par l'équipe infrastructure.

