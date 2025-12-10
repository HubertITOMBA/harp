"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const updateMenuRolesSchema = z.object({
  menuId: z.number().min(1, "L'ID du menu est requis"),
  roleIds: z.array(z.number()).default([]),
});

/**
 * Met à jour les rôles associés à un menu
 * Supprime les anciennes associations et crée les nouvelles
 * 
 * @param menuId - ID du menu
 * @param roleIds - Array des IDs des rôles à associer au menu
 */
export async function updateMenuRoles(menuId: number, roleIds: number[]) {
  try {
    // Validation des données
    const result = updateMenuRolesSchema.safeParse({ menuId, roleIds });
    if (!result.success) {
      return {
        success: false,
        error: "Données invalides",
        details: result.error.errors,
      };
    }

    // Vérifier que le menu existe
    const menu = await prisma.harpmenus.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      return {
        success: false,
        error: "Menu introuvable",
      };
    }

    // Vérifier que tous les rôles existent
    if (roleIds.length > 0) {
      const roles = await prisma.harproles.findMany({
        where: {
          id: { in: roleIds },
        },
      });

      if (roles.length !== roleIds.length) {
        return {
          success: false,
          error: "Un ou plusieurs rôles sont introuvables",
        };
      }
    }

    // Transaction pour supprimer les anciennes associations et créer les nouvelles
    await prisma.$transaction(async (tx) => {
      // Supprimer toutes les associations existantes pour ce menu
      await tx.harpmenurole.deleteMany({
        where: { menuId },
      });

      // Créer les nouvelles associations si des rôles sont fournis
      if (roleIds.length > 0) {
        await tx.harpmenurole.createMany({
          data: roleIds.map((roleId) => ({
            menuId,
            roleId,
            datmaj: new Date(),
          })),
        });
      }
    });

    // Revalider le cache pour cette page et la liste des menus
    revalidatePath(`/list/menus/${menuId}`);
    revalidatePath(`/list/menus`);

    return {
      success: true,
      message: `Rôles mis à jour avec succès (${roleIds.length} rôle(s) associé(s))`,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des rôles du menu:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour des rôles",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ajoute un rôle à un menu
 */
export async function addRoleToMenu(menuId: number, roleId: number) {
  try {
    // Vérifier que l'association n'existe pas déjà
    const existing = await prisma.harpmenurole.findUnique({
      where: {
        menuId_roleId: {
          menuId,
          roleId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Ce rôle est déjà associé à ce menu",
      };
    }

    await prisma.harpmenurole.create({
      data: {
        menuId,
        roleId,
        datmaj: new Date(),
      },
    });

    revalidatePath(`/list/menus/${menuId}`);
    return {
      success: true,
      message: "Rôle ajouté avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout du rôle:", error);
    return {
      success: false,
      error: "Erreur lors de l'ajout du rôle",
    };
  }
}

/**
 * Supprime un rôle d'un menu
 */
export async function removeRoleFromMenu(menuId: number, roleId: number) {
  try {
    await prisma.harpmenurole.delete({
      where: {
        menuId_roleId: {
          menuId,
          roleId,
        },
      },
    });

    revalidatePath(`/list/menus/${menuId}`);
    return {
      success: true,
      message: "Rôle supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du rôle:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du rôle",
    };
  }
}

