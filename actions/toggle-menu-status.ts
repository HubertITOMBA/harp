"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleMenuStatus(menuId: number) {
  try {
    const menu = await db.harpmenus.findUnique({
      where: {
        id: menuId,
      },
    });

    if (!menu) {
      return { success: false, error: "Menu non trouvé" };
    }

    // Toggle active status (0 = désactivé, 1 = activé)
    const newActiveStatus = menu.active === 1 ? 0 : 1;

    await db.harpmenus.update({
      where: {
        id: menuId,
      },
      data: {
        active: newActiveStatus,
      },
    });

    return { 
      success: true, 
      message: `Le menu ${menu.menu} a été ${newActiveStatus === 1 ? "activé" : "désactivé"} avec succès` 
    };
  } catch (error) {
    console.error("Erreur lors de la modification du statut du menu:", error);
    return { 
      success: false, 
      error: "Erreur lors de la modification du statut du menu" 
    };
  } finally {
    revalidatePath("/list/menus");
  }
}

