# Résolution des erreurs sur `/harp/envs/12`

## Problèmes identifiés

### 1. Erreur Dynatrace : Chemin dupliqué dans NODE_OPTIONS

**Erreur :**
```
Error: Cannot find module '/opt/dynatrace/oneagent/agent/bin/1.325.64.20251114-153027/any/nodejs/pl-nodejsagent.js /opt/dynatrace/oneagent/agent/bin/1.325.64.20251114-153027/any/nodejs/pl-nodejsagent.js'
```

**Cause :** Le chemin du module Dynatrace est dupliqué dans `NODE_OPTIONS`, ce qui indique une configuration incorrecte de Dynatrace OneAgent.

**Solution :**

1. **Vérifier la variable NODE_OPTIONS :**
   ```bash
   echo "NODE_OPTIONS: [$NODE_OPTIONS]"
   ```

2. **Si le chemin est dupliqué, corriger la configuration :**
   ```bash
   # Vérifier les fichiers de configuration système
   grep -r "NODE_OPTIONS" ~/.bashrc ~/.bash_profile ~/.profile /etc/profile 2>/dev/null
   
   # Vérifier les variables Dynatrace
   env | grep -i DT
   env | grep -i NODE_OPTIONS
   ```

3. **Solution temporaire : Désactiver Dynatrace pour le processus Next.js :**

   **Option 1 : Utiliser le script de démarrage créé (Recommandé)**
   
   Sur Linux/Mac :
   ```bash
   npm run start:production
   # ou directement
   bash scripts/start-production.sh
   ```
   
   Sur Windows (PowerShell) :
   ```powershell
   npm run start:production:ps1
   # ou directement
   powershell -ExecutionPolicy Bypass -File scripts/start-production.ps1
   ```

   **Option 2 : Modifier le script npm start dans package.json**
   
   Modifier la ligne `"start"` dans `package.json` :
   ```json
   "start": "DT_DISABLE_INJECTION=true DT_AGENT_DISABLED=true NODE_OPTIONS=\"\" next start -p 9352"
   ```
   
   Puis démarrer avec :
   ```bash
   npm start
   ```

   **Option 3 : Définir les variables avant de démarrer**
   
   Sur Linux/Mac :
   ```bash
   export DT_DISABLE_INJECTION=true
   export DT_AGENT_DISABLED=true
   unset NODE_OPTIONS
   npm start
   ```
   
   Sur Windows (PowerShell) :
   ```powershell
   $env:DT_DISABLE_INJECTION = "true"
   $env:DT_AGENT_DISABLED = "true"
   Remove-Item Env:\NODE_OPTIONS -ErrorAction SilentlyContinue
   npm start
   ```

4. **Solution permanente : Contacter l'équipe infrastructure**
   - Demander de vérifier la configuration Dynatrace OneAgent
   - Vérifier que la version OneAgent est >= 1.323 (voir `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md`)
   - Corriger la configuration pour éviter la duplication du chemin

### 2. Erreur Jest Worker : Child process exceptions

**Erreur :**
```
Jest worker encountered 2 child process exceptions, exceeding retry limit
page: '/harp/envs/12'
```

**Cause :** Cette erreur peut être causée par :
- Des requêtes Prisma trop nombreuses ou qui timeout
- Des erreurs non gérées dans les composants serveur
- Des problèmes de mémoire ou de ressources

**Solutions appliquées :**

1. **Optimisation des requêtes Prisma dans `ListEnvs.tsx` :**
   - Remplacement de multiples requêtes individuelles par une seule requête groupée
   - Utilisation d'un `Map` pour organiser les serveurs par environnement
   - Réduction du nombre de requêtes de N*2 à 1 seule requête

2. **Ajout de gestion d'erreur robuste :**
   - Try-catch autour de toutes les requêtes Prisma
   - Fallback vers des valeurs par défaut en cas d'erreur
   - Logging des erreurs pour le débogage

3. **Configuration Next.js déjà en place :**
   - `workerThreads: false` dans `next.config.ts`
   - `cpus: 1` pour limiter l'utilisation des ressources

## Modifications apportées

### 1. `components/harp/ListEnvs.tsx`
- ✅ Optimisation des requêtes serveurs (une seule requête au lieu de N*2)
- ✅ Gestion d'erreur avec try-catch
- ✅ Fallback vers des valeurs par défaut

### 2. `app/(protected)/harp/envs/[id]/page.tsx`
- ✅ Gestion d'erreur globale avec try-catch
- ✅ Gestion d'erreur spécifique pour la requête Prisma

## Vérifications à effectuer

1. **Vérifier que les erreurs ne se produisent plus :**
   - Accéder à `/harp/envs/12` et vérifier les logs
   - Vérifier la console du navigateur

2. **Vérifier les performances :**
   - Les requêtes devraient être plus rapides
   - Moins de charge sur la base de données

3. **Vérifier la configuration Dynatrace :**
   - Contacter l'équipe infrastructure si l'erreur Dynatrace persiste
   - Vérifier la version OneAgent

## Actions recommandées

1. **Court terme :**
   - ✅ Modifications de code appliquées
   - ⏳ Tester en production
   - ⏳ Monitorer les logs

2. **Moyen terme :**
   - Contacter l'équipe infrastructure pour corriger la configuration Dynatrace
   - Mettre à jour OneAgent vers 1.323+ si nécessaire

3. **Long terme :**
   - Implémenter un système de cache pour les requêtes fréquentes
   - Ajouter des timeouts explicites pour les requêtes Prisma
   - Implémenter un système de retry avec backoff exponentiel

