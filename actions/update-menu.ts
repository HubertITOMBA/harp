"use server"

import { db } from "@/lib/db";
import {
  HarpDisplayLockError,
  withHarpDisplayLock,
  type HarpDisplayLockClient,
} from "@/lib/harp-display-lock";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FAMILY_DISPLAY_MIN = 1;
const FAMILY_DISPLAY_MAX = 32767;

const UpdateMenuSchema = z.object({
  menu: z.string().min(1, "Le nom du menu est requis").max(32),
  href: z.string().max(100).optional().or(z.literal("")),
  descr: z.string().max(50).optional().or(z.literal("")),
  icone: z.string().max(50).optional().or(z.literal("")),
  display: z.coerce.number().int().min(0).default(0),
  level: z.coerce.number().int().min(0).default(0),
  active: z.coerce.number().int().min(0).max(1).default(1),
  role: z.string().optional(),
});

type MenuInput = z.infer<typeof UpdateMenuSchema>;

type MenuUpdateResult =
  | { updated: true }
  | { updated: false; error: string };

/**
 * Indique si l'état demandé occupe l'identifiant d'une famille.
 * Seul ce display final est verrouillé. L'ancien ne l'est pas :
 * un seul UPDATE remplace la référence, et createFamily ne peut pas
 * voir l'ancien identifiant libre tant que cet UPDATE n'est pas validé.
 *
 * @param level - Niveau demandé
 * @param display - Display demandé, déjà validé
 * @returns true si le display final doit être verrouillé
 */
function locksFamilyDisplay(level: number, display: number): boolean {
  return (
    level === 3 &&
    Number.isInteger(display) &&
    display >= FAMILY_DISPLAY_MIN &&
    display <= FAMILY_DISPLAY_MAX
  );
}

/**
 * Relit le menu, contrôle le nom, puis écrit les champs demandés.
 * Une famille déjà existante avec typenvid = display n'est pas un refus.
 *
 * @param client - Client courant, ou transaction qui tient le verrou
 * @param menuId - Clé technique harpmenus.id
 * @param data - Champs validés
 * @returns Mise à jour, ou le refus existant
 */
async function applyMenuUpdate(
  client: HarpDisplayLockClient | typeof db,
  menuId: number,
  data: MenuInput,
): Promise<MenuUpdateResult> {
  const existingMenu = await client.harpmenus.findUnique({
    where: {
      id: menuId,
    },
  });

  if (!existingMenu) {
    return { updated: false, error: "Menu non trouvé" };
  }

  if (existingMenu.menu !== data.menu) {
    const duplicateMenu = await client.harpmenus.findUnique({
      where: {
        menu: data.menu,
      },
    });

    if (duplicateMenu) {
      return { updated: false, error: "Un menu avec ce nom existe déjà" };
    }
  }

  await client.harpmenus.update({
    where: {
      id: menuId,
    },
    data: {
      menu: data.menu,
      href: data.href || null,
      descr: data.descr || null,
      icone: data.icone || null,
      display: data.display,
      level: data.level,
      active: data.active,
      role: data.role as any || undefined,
    },
  });

  return { updated: true };
}

/**
 * Met à jour un menu harpmenus.
 * PORTAL_ADMIN est exigé. Si l'état demandé est un menu de niveau 3
 * dont le display est un entier de 1 à 32767, ce display est verrouillé
 * avant la relecture et l'écriture. Une famille déjà présente sur cet
 * identifiant reste autorisée. Aucun second verrou n'est imbriqué.
 *
 * @param menuId - Clé technique du menu
 * @param formData - Champs du formulaire
 * @returns Succès avec message, ou un refus sans écriture
 */
export async function updateMenu(menuId: number, formData: FormData) {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  try {
    const rawData = {
      menu: formData.get("menu") as string,
      href: formData.get("href") as string || undefined,
      descr: formData.get("descr") as string || undefined,
      icone: formData.get("icone") as string || undefined,
      display: formData.get("display") || 0,
      level: formData.get("level") || 0,
      active: formData.get("active") || 1,
      role: formData.get("role") as string || undefined,
    };

    const validatedData = UpdateMenuSchema.parse(rawData);
    const outcome = locksFamilyDisplay(validatedData.level, validatedData.display)
      ? await withHarpDisplayLock(validatedData.display, (tx) =>
          applyMenuUpdate(tx, menuId, validatedData),
        )
      : await applyMenuUpdate(db, menuId, validatedData);

    if (!outcome.updated) {
      return { success: false, error: outcome.error };
    }

    return { 
      success: true, 
      message: `Le menu ${validatedData.menu} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    if (error instanceof HarpDisplayLockError) {
      return { success: false, error: error.message };
    }
    console.error("Erreur lors de la mise à jour du menu:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du menu" 
    };
  } finally {
    revalidatePath("/list/menus");
  }
}
