# Configuration Prisma en Production

## Problème

En production, Prisma peut échouer lors du téléchargement des binaires avec l'erreur :
```
Error: request to https://binaries.prisma.sh/... failed, reason: getaddrinfo ENOTFOUND binaries.prisma.sh
```

Cela se produit généralement lorsque :
- Le serveur n'a pas accès direct à Internet
- Un proxy/firewall bloque l'accès
- Un problème DNS empêche la résolution du nom de domaine

## Solutions

### Solution 1 : Génération du client Prisma avant le build (Recommandée)

Le client Prisma est maintenant généré automatiquement :
- **Pendant le build** : Le script `build` inclut `prisma generate`
- **Après l'installation** : Le script `postinstall` génère automatiquement le client

Cela garantit que le client Prisma est toujours disponible, même si le téléchargement des binaires échoue en production.

### Solution 2 : Configuration du proxy pour Prisma

Si votre environnement nécessite un proxy (comme `proxy.adsaft.ft.net:8080`), configurez les variables d'environnement suivantes :

#### Sur Linux/Unix :
```bash
export HTTP_PROXY=http://proxy.adsaft.ft.net:8080
export HTTPS_PROXY=http://proxy.adsaft.ft.net:8080
export NO_PROXY=localhost,127.0.0.1
```

#### Sur Windows (PowerShell) :
```powershell
$env:HTTP_PROXY="http://proxy.adsaft.ft.net:8080"
$env:HTTPS_PROXY="http://proxy.adsaft.ft.net:8080"
$env:NO_PROXY="localhost,127.0.0.1"
```

#### Dans un fichier `.env` (pour npm) :
```env
HTTP_PROXY=http://proxy.adsaft.ft.net:8080
HTTPS_PROXY=http://proxy.adsaft.ft.net:8080
NO_PROXY=localhost,127.0.0.1
```

### Solution 3 : Pré-génération du client Prisma

Si vous ne pouvez pas configurer le proxy, générez le client Prisma **avant** le déploiement en production :

1. **En local** (avec accès Internet) :
```bash
npm install
npx prisma generate
```

2. **Copiez le dossier `node_modules/.prisma`** dans votre environnement de production

3. **Ou incluez-le dans votre build** : Le client généré sera inclus dans le build Next.js

### Solution 4 : Utilisation de binaires Prisma pré-téléchargés

Vous pouvez télécharger manuellement les binaires Prisma et les placer dans le dossier approprié :

1. Téléchargez les binaires depuis : https://binaries.prisma.sh/
2. Placez-les dans : `node_modules/.prisma/client/` ou `node_modules/prisma/`

## Vérification

Pour vérifier que le client Prisma est correctement généré :

```bash
# Vérifier que le client est généré
ls -la node_modules/.prisma/client/

# Tester la génération
npx prisma generate
```

## Déploiement en production

### Workflow recommandé :

1. **Installation des dépendances** :
```bash
npm install
# Le script postinstall génère automatiquement le client Prisma
```

2. **Build de l'application** :
```bash
npm run build
# Le script build génère également le client Prisma avant le build Next.js
```

3. **Démarrage** :
```bash
npm start
```

### Si le proxy est nécessaire :

1. Configurez les variables d'environnement du proxy (voir Solution 2)
2. Exécutez les commandes ci-dessus

## Notes importantes

- Le client Prisma généré est **spécifique à la plateforme** (Linux, Windows, macOS)
- Assurez-vous de générer le client sur la même plateforme que celle de production
- Le client généré est inclus dans le build Next.js, donc il n'est pas nécessaire de le régénérer à chaque démarrage
- Si vous utilisez Docker, générez le client dans l'image Docker ou utilisez un multi-stage build

## Dépannage

### Erreur persistante après configuration du proxy

1. Vérifiez que le proxy est accessible :
```bash
curl -x http://proxy.adsaft.ft.net:8080 https://binaries.prisma.sh
```

2. Vérifiez les variables d'environnement :
```bash
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

3. Essayez de générer manuellement avec le proxy :
```bash
HTTP_PROXY=http://proxy.adsaft.ft.net:8080 HTTPS_PROXY=http://proxy.adsaft.ft.net:8080 npx prisma generate
```

### Le client Prisma n'est pas trouvé en production

Assurez-vous que :
- Le script `postinstall` s'exécute correctement
- Le dossier `node_modules/.prisma` est inclus dans le déploiement
- Les permissions sont correctes sur les fichiers générés









