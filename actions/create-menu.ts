"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

export async function createMenu(formData: FormData) {
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

    // Vérifier si le menu existe déjà (menu est unique)
    const existingMenu = await db.harpmenus.findUnique({
      where: {
        menu: validatedData.menu,
      },
    });

    if (existingMenu) {
      return { success: false, error: "Un menu avec ce nom existe déjà" };
    }

    const newMenu = await db.harpmenus.create({
      data: {
        menu: validatedData.menu,
        href: validatedData.href || null,
        descr: validatedData.descr || null,
        icone: validatedData.icone || null,
        display: validatedData.display,
        level: validatedData.level,
        active: validatedData.active,
        role: validatedData.role as any || undefined,
      },
    });

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
    console.error("Erreur lors de la création du menu:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du menu" 
    };
  } finally {
    revalidatePath("/list/menus");
  }
}

