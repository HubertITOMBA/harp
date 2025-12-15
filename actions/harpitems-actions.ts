"use server";

import { db } from "@/lib/db";
import { z } from "zod";

// Schéma pour créer un item réutilisable
const createHarpItemSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(255, "La description ne peut pas dépasser 255 caractères"),
});

// Schéma pour rechercher des items
const searchHarpItemsSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

/**
 * Crée un nouvel item réutilisable
 */
export async function createHarpItem(data: z.infer<typeof createHarpItemSchema>) {
  try {
    const validatedData = createHarpItemSchema.parse(data);
    
    // Vérifier si l'item existe déjà
    const existing = await db.harpitems.findUnique({
      where: { descr: validatedData.descr },
    });
    
    if (existing) {
      return { success: true, data: existing, message: "Item déjà existant" };
    }
    
    const item = await db.harpitems.create({
      data: {
        descr: validatedData.descr,
      },
    });
    
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Erreur lors de la création de l'item:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Un item avec cette description existe déjà" };
    }
    return { success: false, error: error.message || "Erreur lors de la création de l'item" };
  }
}

/**
 * Recherche des items réutilisables par description
 */
export async function searchHarpItems(data: z.infer<typeof searchHarpItemsSchema>) {
  try {
    const validatedData = searchHarpItemsSchema.parse(data);
    
    const where = validatedData.query
      ? {
          descr: {
            contains: validatedData.query,
            mode: "insensitive" as const,
          },
        }
      : {};
    
    const items = await db.harpitems.findMany({
      where,
      orderBy: {
        descr: "asc",
      },
      take: validatedData.limit,
    });
    
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Erreur lors de la recherche d'items:", error);
    return { success: false, error: error.message || "Erreur lors de la recherche d'items" };
  }
}

/**
 * Récupère tous les items réutilisables
 */
export async function getAllHarpItems() {
  try {
    const items = await db.harpitems.findMany({
      orderBy: {
        descr: "asc",
      },
    });
    
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des items:", error);
    return { success: false, error: error.message || "Erreur lors de la récupération des items" };
  }
}

/**
 * Récupère un item par son ID
 */
export async function getHarpItemById(id: number) {
  try {
    const item = await db.harpitems.findUnique({
      where: { id },
    });
    
    if (!item) {
      return { success: false, error: "Item non trouvé" };
    }
    
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'item:", error);
    return { success: false, error: error.message || "Erreur lors de la récupération de l'item" };
  }
}

/**
 * Met à jour un item réutilisable
 */
const updateHarpItemSchema = z.object({
  id: z.number(),
  descr: z.string().min(1, "La description est requise").max(255, "La description ne peut pas dépasser 255 caractères"),
});

export async function updateHarpItem(data: z.infer<typeof updateHarpItemSchema>) {
  try {
    const validatedData = updateHarpItemSchema.parse(data);
    const { id, descr } = validatedData;
    
    // Vérifier si un autre item avec cette description existe déjà
    const existing = await db.harpitems.findFirst({
      where: {
        descr: descr,
        id: { not: id },
      },
    });
    
    if (existing) {
      return { success: false, error: "Un item avec cette description existe déjà" };
    }
    
    const item = await db.harpitems.update({
      where: { id },
      data: { descr },
    });
    
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'item:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Un item avec cette description existe déjà" };
    }
    return { success: false, error: error.message || "Erreur lors de la mise à jour de l'item" };
  }
}

/**
 * Supprime un item réutilisable
 */
export async function deleteHarpItem(id: number) {
  try {
    // Vérifier si l'item est utilisé dans des tâches
    const item = await db.harpitems.findUnique({
      where: { id },
      include: {
        _count: {
          select: { taskItems: true },
        },
      },
    });
    
    if (!item) {
      return { success: false, error: "Item non trouvé" };
    }
    
    if (item._count.taskItems > 0) {
      return { success: false, error: `Impossible de supprimer cet item car il est utilisé dans ${item._count.taskItems} tâche(s)` };
    }
    
    await db.harpitems.delete({
      where: { id },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'item:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression de l'item" };
  }
}
