# Résolution de l'erreur Dynatrace : Chemin dupliqué dans NODE_OPTIONS

## Problème

En production, l'application génère l'erreur suivante :

```
Error: Cannot find module '/opt/dynatrace/oneagent/agent/bin/1.325.64.20251114-153027/any/nodejs/pl-nodejsagent.js /opt/dynatrace/oneagent/agent/bin/1.325.64.20251114-153027/any/nodejs/pl-nodejsagent.js'
Require stack:
- internal/preload
```

**Cause :** Le chemin du module Dynatrace est dupliqué dans `NODE_OPTIONS`, ce qui indique que Dynatrace OneAgent injecte `NODE_OPTIONS` avec le chemin dupliqué ou que la variable est définie plusieurs fois dans l'environnement.

## Solution appliquée

Le script `scripts/start-production.sh` a été amélioré pour :

1. **Nettoyer NODE_OPTIONS** : Supprimer toutes les références à Dynatrace dans `NODE_OPTIONS` avant de démarrer l'application
2. **Forcer NODE_OPTIONS vide** : Utiliser `env -u NODE_OPTIONS` pour supprimer complètement la variable de l'environnement hérité
3. **Désactiver Dynatrace** : Définir toutes les variables d'environnement pour désactiver Dynatrace (`DT_DISABLE_INJECTION`, `DT_AGENT_DISABLED`, `DT_ONEAGENT_DISABLED`)

## Utilisation

Pour démarrer l'application en production :

```bash
npm run start:production
# ou directement
bash scripts/start-production.sh
```

Le script va :
- Nettoyer `NODE_OPTIONS` de toutes les références à Dynatrace
- Forcer `NODE_OPTIONS` à être vide avec `env -u`
- Démarrer Next.js sans les options Dynatrace

## Vérification

Pour vérifier que `NODE_OPTIONS` est bien vide avant le démarrage :

```bash
echo "NODE_OPTIONS: [$NODE_OPTIONS]"
# Doit afficher : NODE_OPTIONS: []
```

## Solution permanente recommandée

Pour une solution permanente, contacter l'équipe infrastructure pour :

1. **Vérifier la configuration Dynatrace OneAgent** : Le chemin dupliqué peut indiquer une configuration incorrecte
2. **Mettre à jour OneAgent vers 1.323+** : Les versions récentes utilisent `--require` au lieu de `-r`, ce qui évite les problèmes avec Next.js
3. **Configurer Dynatrace pour exclure le processus Next.js** : Si le monitoring Dynatrace n'est pas nécessaire pour cette application

Voir `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` pour plus de détails sur la mise à jour OneAgent.

## Statut Dynatrace OneAgent

Le service Dynatrace OneAgent est actif sur le serveur :

```bash
systemctl status oneagent
```

Le service est actif, mais l'injection de `NODE_OPTIONS` cause des problèmes avec Next.js. La solution temporaire est de désactiver l'injection pour le processus Next.js via les variables d'environnement et le nettoyage de `NODE_OPTIONS`.

## Références

- `docs/RESOLUTION_ERREURS_HARP_ENVS.md` : Documentation sur les erreurs Dynatrace
- `docs/SOLUTION_DYNATRACE_ONAGENT_1323.md` : Solution recommandée avec OneAgent 1.323+
- `docs/DEMANDE_INFRASTRUCTURE_DYNATRACE.md` : Demande à l'équipe infrastructure

