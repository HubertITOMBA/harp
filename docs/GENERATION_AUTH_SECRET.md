# Génération d'un AUTH_SECRET

Le `AUTH_SECRET` est une clé secrète utilisée par NextAuth.js pour chiffrer les sessions et les tokens JWT. Il doit être **aléatoire, long et sécurisé**.

## Méthodes de génération

### Méthode 1 : OpenSSL (Linux/Mac) - **Recommandé**

```bash
openssl rand -base64 32
```

**Exemple de sortie** :
```
K8j3mN9pQ2rT5vX7wY0zA1bC4dE6fG8hI=
```

### Méthode 2 : PowerShell (Windows)

```powershell
# Générer un secret aléatoire de 32 caractères
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Alternative PowerShell (plus long)** :
```powershell
# Générer un secret en base64 (recommandé)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Méthode 3 : Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Méthode 4 : Générateur en ligne

**Site officiel NextAuth.js** :
https://generate-secret.vercel.app/32

1. Ouvrir le lien ci-dessus
2. Cliquer sur "Generate"
3. Copier le secret généré

## Utilisation dans le fichier .env

Une fois le secret généré, ajoutez-le dans votre fichier `.env` :

```env
AUTH_SECRET=K8j3mN9pQ2rT5vX7wY0zA1bC4dE6fG8hI=
```

**⚠️ Important** :
- Ne pas mettre de guillemets autour de la valeur
- Ne pas mettre d'espaces avant ou après le `=`
- Le secret doit faire au moins 32 caractères
- Ne jamais commiter le fichier `.env` dans Git

## Vérification

Pour vérifier que votre `AUTH_SECRET` est correctement configuré :

```bash
npm run check-env
```

Le script affichera `✅ AUTH_SECRET: ***XXXX` si le secret est défini.

## Sécurité

### Bonnes pratiques

1. **Un secret unique par environnement** :
   - Un secret pour le développement (`.env.local`)
   - Un secret différent pour la production (`.env`)

2. **Longueur minimale** :
   - Au moins 32 caractères (recommandé : 32-64 caractères)

3. **Complexité** :
   - Utiliser des caractères aléatoires (pas de mots de passe prévisibles)
   - Mélanger lettres, chiffres et caractères spéciaux

4. **Rotation** :
   - Changer le secret régulièrement (tous les 6-12 mois)
   - **Attention** : Changer le secret invalide toutes les sessions existantes

### Ce qu'il ne faut PAS faire

❌ **Ne pas utiliser** :
- Des mots de passe simples ou prévisibles
- Des secrets partagés entre plusieurs applications
- Des secrets commités dans Git
- Des secrets trop courts (< 32 caractères)

✅ **À faire** :
- Générer un secret aléatoire unique
- Stocker le secret dans `.env` (non commité)
- Utiliser des secrets différents par environnement

## Exemple complet

```bash
# 1. Générer le secret
openssl rand -base64 32

# Sortie : K8j3mN9pQ2rT5vX7wY0zA1bC4dE6fG8hI=

# 2. Ajouter dans .env
echo "AUTH_SECRET=K8j3mN9pQ2rT5vX7wY0zA1bC4dE6fG8hI=" >> .env

# 3. Vérifier
npm run check-env
```

## Dépannage

### Erreur "AUTH_SECRET is missing"

**Cause** : Le secret n'est pas défini dans `.env`.

**Solution** :
1. Générer un secret avec une des méthodes ci-dessus
2. Ajouter `AUTH_SECRET=votre-secret` dans `.env`
3. Redémarrer l'application

### Erreur "Invalid secret"

**Cause** : Le secret est trop court ou mal formaté.

**Solution** :
1. Vérifier que le secret fait au moins 32 caractères
2. Vérifier qu'il n'y a pas d'espaces ou de guillemets
3. Régénérer un nouveau secret si nécessaire

### Les sessions sont invalidées après redémarrage

**Cause** : Le secret a été changé.

**Solution** :
- C'est normal : changer le secret invalide toutes les sessions
- Les utilisateurs devront se reconnecter

