# TODO - Refactorisation des Dialogs

## ⚠️ À faire avant la fin du développement

### Objectif
Refactoriser les composants suivants pour permettre un contrôle externe complet via `open` et `onOpenChange` :

1. **EditMenuDialog** (`components/menu/EditMenuDialog.tsx`)
2. **EditEnvDialog** (`components/env/EditEnvDialog.tsx`)
3. **EditServerDialog** (`components/server/EditServerDialog.tsx`)

### Pourquoi ?
Ces composants utilisent actuellement `FormDialog` avec leur propre trigger. Bien que les interfaces acceptent `open` et `onOpenChange`, ils ne sont pas complètement contrôlables depuis l'extérieur (par exemple, depuis le menu déroulant d'actions).

### Référence
Voir `docs/REFACTORING_NOTES.md` pour les détails complets et le pattern à suivre.

### Composants de référence (déjà refactorisés)
- ✅ `components/tools/EditToolsDialog.tsx`
- ✅ `components/role/EditRoleDialog.tsx`
- ✅ `components/appli/EditAppliDialog.tsx`
- ✅ `components/user/EditUserDialog.tsx`

### Pattern à suivre
Suivre le même pattern que les composants de référence ci-dessus :
- Extraire le contenu du formulaire dans `formContent`
- Implémenter deux modes : contrôlé (Dialog) et non-contrôlé (FormDialog)
- Tester les deux modes de fonctionnement

### Priorité
**Moyenne** - Les composants fonctionnent actuellement, mais la refactorisation améliorera la cohérence et le contrôle.

### Effort estimé
2-3 heures par composant (total: 6-9 heures)

---

**Date de création:** Décembre 2024  
**Documentation complète:** `docs/REFACTORING_NOTES.md`
