"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateItemSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(255, "La description ne peut pas dépasser 255 caractères"),
});

const UpdateItemSchema = z.object({
  id: z.number(),
  descr: z.string().min(1, "La description est requise").max(255, "La description ne peut pas dépasser 255 caractères"),
});

/**
 * Récupère tous les items
 * 
 * @returns Un tableau d'items avec leurs informations
 */
export async function getAllItems() {
  try {
    const items = await db.harpitems.findMany({
      orderBy: {
        descr: "asc",
      },
      include: {
        _count: {
          select: { taskItems: true },
        },
      },
    });

    return items;
  } catch (error) {
    console.error("Erreur lors de la récupération des items:", error);
    return [];
  }
}

/**
 * Récupère un item par son identifiant
 * 
 * @param id - L'identifiant numérique de l'item à récupérer
 * @returns L'item trouvé ou null si il n'existe pas
 */
export async function getItemById(id: number) {
  try {
    const item = await db.harpitems.findUnique({
      where: { id },
      include: {
        _count: {
          select: { taskItems: true },
        },
      },
    });

    return item;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'item:", error);
    return null;
  }
}

/**
 * Crée un nouvel item dans la base de données
 * 
 * @param formData - Les données du formulaire contenant la description de l'item
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec, et id (number) de l'item créé
 */
export async function createItem(formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
    };

    const validatedData = CreateItemSchema.parse(rawData);

    // Vérifier les doublons
    const existing = await db.harpitems.findUnique({
      where: { descr: validatedData.descr },
    });

    if (existing) {
      return { success: false, error: "Un item avec cette description existe déjà" };
    }

    // Créer l'item
    const newItem = await db.harpitems.create({
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Item "${validatedData.descr}" créé avec succès`,
      id: newItem.id 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la création de l'item" };
  } finally {
    revalidatePath("/list/items");
  }
}

/**
 * Met à jour un item existant
 * 
 * @param formData - Les données du formulaire contenant l'id et la nouvelle description
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function updateItem(formData: FormData) {
  try {
    const rawData = {
      id: parseInt(formData.get("id") as string, 10),
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdateItemSchema.parse(rawData);

    // Vérifier que l'item existe
    const existing = await db.harpitems.findUnique({
      where: { id: validatedData.id },
    });

    if (!existing) {
      return { success: false, error: "Item non trouvé" };
    }

    // Vérifier les doublons (sauf pour l'item actuel)
    const duplicate = await db.harpitems.findUnique({
      where: { descr: validatedData.descr },
    });

    if (duplicate && duplicate.id !== validatedData.id) {
      return { success: false, error: "Un item avec cette description existe déjà" };
    }

    // Mettre à jour l'item
    await db.harpitems.update({
      where: { id: validatedData.id },
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Item "${validatedData.descr}" modifié avec succès`
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la modification de l'item" };
  } finally {
    revalidatePath("/list/items");
  }
}

/**
 * Supprime un item
 * 
 * @param id - L'identifiant numérique de l'item à supprimer
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function deleteItem(id: number) {
  try {
    // Vérifier que l'item existe
    const existing = await db.harpitems.findUnique({
      where: { id },
      include: {
        _count: {
          select: { taskItems: true },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Item non trouvé" };
    }

    // Vérifier si l'item est utilisé dans des tâches
    if (existing._count.taskItems > 0) {
      return { 
        success: false, 
        error: `Cet item est utilisé dans ${existing._count.taskItems} tâche(s). Supprimez d'abord les tâches associées.` 
      };
    }

    // Supprimer l'item
    await db.harpitems.delete({
      where: { id },
    });

    return { 
      success: true, 
      message: `Item "${existing.descr}" supprimé avec succès`
    };
  } catch (error) {
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression de l'item" };
  } finally {
    revalidatePath("/list/items");
  }
}

