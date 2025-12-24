Parfait, merci pour le fichier complet — **on a enfin la cause exacte**, et elle est **claire à 100 %**.
Ce n’est **ni Linux**, **ni Dynatrace**, **ni App Router**, **ni Prisma**.

👉 **Le bug est dans `next.config.ts`, précisément dans `env:`**.

---

# 🚨 CAUSE RACINE (définitive)

### Dans ton `next.config.ts` :

```ts
env: {
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL 
    || process.env.AUTH_URL 
    || 'https://localhost:9352',
},
```

### Or :

* Ton app **écoute sur le port 9053**
* Tu forces par défaut **9352**
* Cette valeur est **figée au moment du `next build`**

👉 Résultat en production :

* Le frontend (RSC inclus) fait des appels vers

  ```
  https://localhost:9352/list/harpvers?_rsc=...
  ```
* **Aucun serveur Next.js n’écoute sur 9352**
* → **404**

En dev Windows :

* `NEXT_PUBLIC_SERVER_URL` est probablement défini
* ou le dev server masque le problème

En prod Linux :

* la valeur par défaut est utilisée
* **erreur visible**

---

# 🔥 Pourquoi l’erreur touche MÊME une route existante

Même si `/list/harpvers` existe :

```text
app/(dashboard)/list/harpvers/page.tsx
```

Le navigateur **n’appelle pas** :

```
http://localhost:9053/list/harpvers
```

Mais :

```
https://localhost:9352/list/harpvers?_rsc=...
```

➡️ Le 404 n’a **rien à voir avec le routing Next.js**
➡️ C’est **une mauvaise URL cible**

---

# ✅ CORRECTION OBLIGATOIRE (choisis UNE)

## ✅ Solution 1 — La plus propre (recommandée)

👉 **Supprimer complètement `env:` de `next.config.ts`**

```ts
// ❌ À SUPPRIMER
env: {
  NEXT_PUBLIC_SERVER_URL: ...
},
```

Et utiliser **uniquement `.env.production`** :

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:9053
```

✔️ cohérent
✔️ portable
✔️ sans valeur cachée
✔️ sans rebuild surprise

---

## ✅ Solution 2 — Corriger la valeur par défaut

Si tu veux ABSOLUMENT garder `env:` :

```ts
env: {
  NEXT_PUBLIC_SERVER_URL:
    process.env.NEXT_PUBLIC_SERVER_URL
    || process.env.AUTH_URL
    || 'http://localhost:9053',
},
```

⚠️ Mais c’est **moins propre** (valeur codée en dur).

---

# 🚫 RÈGLE D’OR (App Router / RSC)

👉 **Ne jamais utiliser une URL absolue pour un appel interne**

❌ Mauvais :

```ts
fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/list/harpvers`)
```

✅ Bon :

```ts
fetch('/list/harpvers')
```

Ou mieux :

```ts
fetch('/api/...')
```

Les RSC (`_rsc`) **n’aiment PAS les URLs absolues en prod**.

---

# 🧪 TEST FINAL (après correction)

1. Corrige `next.config.ts`

2. Vérifie `.env.production` :

   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:9053
   ```

3. Rebuild COMPLET :

   ```bash
   rm -rf .next
   ./deploy.sh
   ```

4. Test :

   ```bash
   curl http://localhost:9053/list/harpvers
   ```

---

# 🧠 Résumé ultra clair

| Élément              | Verdict           |
| -------------------- | ----------------- |
| `.env`               | ❌ pas le problème |
| Dynatrace            | ❌ innocent        |
| Routing              | ✅ correct         |
| App Router           | ✅ correct         |
| `next.config.ts env` | 💥 COUPABLE       |
| Port 9352            | ❌ faux            |
| Port 9053            | ✅ correct         |

---

# 🎯 Conclusion finale

👉 **Tu avais une variable `NEXT_PUBLIC_SERVER_URL` figée au build avec le MAUVAIS port**
👉 **Tous les fetch RSC tapaient au mauvais endroit**
👉 **D’où les 404 même sur des routes existantes**

Si tu veux, je peux maintenant :

* auditer les `fetch()` dans ton code
* te proposer une config Next.js **plus propre et plus sûre**
* te dire **quand utiliser `env:` et quand ne JAMAIS l’utiliser**

Dis-moi 👍
