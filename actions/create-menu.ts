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

const CreateMenuSchema = z.object({
  menu: z.string().min(1, "Le nom du menu est requis").max(32),
  href: z.string().max(100).optional().or(z.literal("")),
  descr: z.string().max(50).optional().or(z.literal("")),
  icone: z.string().max(50).optional().or(z.literal("")),
  display: z.coerce.number().int().min(0).default(0),
  level: z.coerce.number().int().min(0).default(0),
  active: z.coerce.number().int().min(0).max(1).default(1),
  role: z.string().optional(),
});

type MenuInput = z.infer<typeof CreateMenuSchema>;

type MenuWriteResult =
  | { created: true }
  | { created: false; error: string };

/**
 * Indique si ce menu partage l'identifiant d'une famille.
 * Hors niveau 3, ou hors de la plage 1–32767, aucun verrou n'est pris.
 *
 * @param level - Niveau du menu
 * @param display - Valeur display déjà validée
 * @returns true seulement pour un menu de famille verrouillable
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
 * Vérifie l'unicité du nom puis insère le menu.
 * Une famille déjà présente avec typenvid = display n'est pas un refus :
 * c'est la convention qui relie le menu de niveau 3 à la famille.
 *
 * @param client - Client courant, ou transaction qui tient le verrou
 * @param data - Champs validés du menu
 * @returns Création, ou le refus de nom déjà utilisé
 */
async function writeMenu(
  client: HarpDisplayLockClient | typeof db,
  data: MenuInput,
): Promise<MenuWriteResult> {
  const existingMenu = await client.harpmenus.findUnique({
    where: {
      menu: data.menu,
    },
  });

  if (existingMenu) {
    return { created: false, error: "Un menu avec ce nom existe déjà" };
  }

  await client.harpmenus.create({
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

  return { created: true };
}

/**
 * Crée un menu harpmenus.
 * PORTAL_ADMIN est exigé. Un menu de niveau 3 dont le display est un entier
 * de 1 à 32767 prend le verrou de cet identifiant, le temps du contrôle
 * de nom et de l'insertion, pour se coordonner avec createFamily.
 *
 * @param formData - Champs du formulaire de création
 * @returns Succès avec message, ou un refus sans menu créé
 */
export async function createMenu(formData: FormData) {
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

    const validatedData = CreateMenuSchema.parse(rawData);
    const outcome = locksFamilyDisplay(validatedData.level, validatedData.display)
      ? await withHarpDisplayLock(validatedData.display, (tx) => writeMenu(tx, validatedData))
      : await writeMenu(db, validatedData);

    if (!outcome.created) {
      return { success: false, error: outcome.error };
    }

    return { 
      success: true, 
      message: `Le menu ${validatedData.menu} a été créé avec succès`,
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
    console.error("Erreur lors de la création du menu:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du menu" 
    };
  } finally {
    revalidatePath("/list/menus");
  }
}
