# Notes de Refactorisation - Menus d'Actions

## Date de création
Décembre 2024

## Contexte
Lors de l'implémentation des menus déroulants d'actions (trois points) pour remplacer les boutons d'actions dans les pages de liste, certains composants nécessitent une refactorisation complète pour un contrôle externe optimal.

## Composants à refactoriser

### 1. EditMenuDialog
**Fichier:** `components/menu/EditMenuDialog.tsx`

**État actuel:**
- Utilise `FormDialog` avec son propre trigger
- Interface accepte `open` et `onOpenChange` mais ne les utilise pas complètement
- Fonctionne via son propre bouton dans le menu déroulant

**Action requise:**
- Extraire le contenu du formulaire dans une variable `formContent`
- Implémenter deux modes :
  - Mode contrôlé : Utiliser `Dialog` directement quand `open`/`onOpenChange` sont fournis
  - Mode non-contrôlé : Utiliser `FormDialog` avec trigger (comportement actuel)
- Suivre le pattern utilisé dans `EditToolsDialog.tsx` et `EditRoleDialog.tsx`

**Référence:** Voir `components/tools/EditToolsDialog.tsx` pour l'exemple de refactorisation complète

---

### 2. EditEnvDialog
**Fichier:** `components/env/EditEnvDialog.tsx`

**État actuel:**
- Utilise `FormDialog` avec son propre trigger
- Interface accepte `open` et `onOpenChange` mais ne les utilise pas complètement
- Fonctionne via son propre bouton dans le menu déroulant

**Action requise:**
- Même refactorisation que `EditMenuDialog`
- Extraire le contenu du formulaire
- Implémenter les deux modes (contrôlé/non-contrôlé)

---

### 3. EditServerDialog
**Fichier:** `components/server/EditServerDialog.tsx`

**État actuel:**
- Utilise `FormDialog` avec son propre trigger
- Interface accepte `open` et `onOpenChange` mais ne les utilise pas complètement
- Fonctionne via son propre bouton dans le menu déroulant

**Action requise:**
- Même refactorisation que `EditMenuDialog` et `EditEnvDialog`
- Extraire le contenu du formulaire
- Implémenter les deux modes (contrôlé/non-contrôlé)

---

## Pattern de refactorisation

### Exemple de structure à suivre

```typescript
export function EditXxxDialog({ xxx, open: controlledOpen, onOpenChange }: EditXxxDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // ... logique du composant ...

  const formContent = (
    <>
      {/* Contenu du formulaire */}
    </>
  );

  // Si open/onOpenChange sont fournis, utiliser Dialog directement
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>...</DialogTitle>
            <DialogDescription>...</DialogDescription>
          </DialogHeader>
          <form onSubmit={...}>
            <div className="space-y-4 py-4">
              {formContent}
            </div>
            <DialogFooter>
              {/* Boutons */}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Sinon, utiliser FormDialog avec trigger
  return (
    <FormDialog
      trigger={...}
      title={...}
      onSubmit={...}
    >
      {formContent}
    </FormDialog>
  );
}
```

### Composants de référence (déjà refactorisés)
- ✅ `components/tools/EditToolsDialog.tsx`
- ✅ `components/role/EditRoleDialog.tsx`
- ✅ `components/appli/EditAppliDialog.tsx`
- ✅ `components/user/EditUserDialog.tsx`

---

## Pages mises à jour avec menu déroulant

Toutes les pages suivantes utilisent maintenant le composant `ActionsDropdown` :

- ✅ `/list/tools` - `ToolsActions`
- ✅ `/list/roles` - `RoleActions`
- ✅ `/list/users` - `UserActions`
- ✅ `/list/menus` - `MenuActions`
- ✅ `/list/envs` - `EnvActions`
- ✅ `/list/servers` - `ServerActions`
- ✅ `/list/appli` - `AppliActions`

---

## Composant réutilisable

**Fichier:** `components/ui/actions-dropdown.tsx`

Le composant `ActionsDropdown` est disponible et réutilisable pour toutes les autres pages de liste qui contiennent une colonne "Actions".

**Utilisation:**
```typescript
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';

const actions: ActionItem[] = [
  {
    label: "Voir",
    icon: <Eye className="h-4 w-4" />,
    onClick: () => setViewOpen(true),
  },
  {
    label: "Modifier",
    icon: <Pencil className="h-4 w-4" />,
    onClick: () => setEditOpen(true),
  },
];

return <ActionsDropdown actions={actions} />;
```

---

## Priorité

**Priorité:** Moyenne
**Impact:** Amélioration de l'expérience utilisateur (cohérence du comportement)
**Effort estimé:** 2-3 heures par composant

## Notes supplémentaires

- Les composants fonctionnent actuellement correctement, mais la refactorisation permettra un contrôle plus fin et une meilleure cohérence avec les autres composants
- La refactorisation peut être effectuée progressivement, un composant à la fois
- Tester chaque refactorisation pour s'assurer que le comportement reste identique

---

## Checklist de refactorisation

Pour chaque composant à refactoriser :

- [ ] Extraire le contenu du formulaire dans `formContent`
- [ ] Ajouter la gestion de `open` et `onOpenChange`
- [ ] Implémenter le mode contrôlé avec `Dialog`
- [ ] Conserver le mode non-contrôlé avec `FormDialog`
- [ ] Tester l'ouverture depuis le menu déroulant
- [ ] Tester l'ouverture depuis le bouton direct (si applicable)
- [ ] Vérifier que la soumission du formulaire fonctionne dans les deux modes
- [ ] Vérifier que la fermeture du dialog fonctionne correctement
- [ ] Tester les messages d'erreur et de succès
