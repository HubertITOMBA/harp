# Guide de dépannage complet pour les problèmes de build

## Problème : `--r= is not allowed in NODE_OPTIONS`

### Diagnostic étape par étape

#### Étape 1 : Vérifier NODE_OPTIONS

```bash
# Vérifier la valeur actuelle
echo "NODE_OPTIONS: [$NODE_OPTIONS]"

# Si elle contient quelque chose, c'est le problème
```

#### Étape 2 : Identifier la source

```bash
# Vérifier les fichiers de configuration
grep -r "NODE_OPTIONS" ~/.bashrc ~/.bash_profile ~/.profile /etc/profile 2>/dev/null

# Vérifier les variables Dynatrace
env | grep -i DT
env | grep -i NODE_OPTIONS
```

#### Étape 3 : Essayer les solutions dans l'ordre

**Solution 1 : Build standard**
```bash
npm run build
```

**Solution 2 : Build avec Dynatrace désactivé**
```bash
npm run build:no-dynatrace
```

**Solution 3 : Build avec wrapper node**
```bash
npm run build:final
```

**Solution 4 : Build manuel avec environnement isolé**
```bash
# Créer un script temporaire
cat > /tmp/build-isolated.sh << 'EOF'
#!/bin/bash
export DT_DISABLE_INJECTION=true
export DT_AGENT_DISABLED=true
unset NODE_OPTIONS
export NODE_OPTIONS=""
NEXT_PRIVATE_WORKER=0 npx prisma generate
NEXT_PRIVATE_WORKER=0 npx next build
EOF
chmod +x /tmp/build-isolated.sh
bash /tmp/build-isolated.sh
```

## Solutions par ordre de priorité

### 1. Désactiver Dynatrace (si possible)

```bash
# Méthode 1 : Variables d'environnement
export DT_DISABLE_INJECTION=true
export DT_AGENT_DISABLED=true
npm run build

# Méthode 2 : Arrêter l'agent (nécessite les droits)
sudo systemctl stop dynatrace-oneagent
npm run build
sudo systemctl start dynatrace-oneagent
```

### 2. Utiliser un wrapper node

Le script `build-final.sh` crée un wrapper qui intercepte tous les appels à node :

```bash
npm run build:final
```

### 3. Modifier les fichiers de configuration système

Si NODE_OPTIONS est défini dans un fichier système :

```bash
# Éditer le fichier
nano ~/.bashrc  # ou ~/.profile, /etc/profile, etc.

# Commenter ou supprimer la ligne qui définit NODE_OPTIONS
# Exemple :
# export NODE_OPTIONS="-r /opt/dynatrace/..."

# Recharger la configuration
source ~/.bashrc
```

### 4. Utiliser un conteneur Docker

Créer un Dockerfile isolé pour le build :

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```

### 5. Contacter l'équipe infrastructure

Si aucune solution ne fonctionne, contacter l'équipe infrastructure pour :
- Configurer Dynatrace pour exclure le processus de build
- Créer une exception pour le répertoire de build
- Désactiver temporairement l'agent pour les builds

## Commandes de diagnostic

```bash
# Script de diagnostic
bash scripts/check-node-options.sh

# Vérifier tous les processus node
ps aux | grep node

# Vérifier les variables d'environnement d'un processus
cat /proc/$(pgrep -f "next build")/environ | tr '\0' '\n' | grep NODE
```

## Logs utiles

Si le build échoue, vérifier :
- Les logs Next.js dans `.next/`
- Les logs système : `journalctl -u dynatrace-oneagent`
- Les variables d'environnement du processus : `/proc/PID/environ`

## Contact et support

Si le problème persiste après avoir essayé toutes les solutions :
1. Collecter les informations de diagnostic
2. Noter la version de Node.js : `node --version`
3. Noter la version de Next.js : `npx next --version`
4. Noter la version de Dynatrace (si disponible)
5. Contacter l'équipe infrastructure avec ces informations

