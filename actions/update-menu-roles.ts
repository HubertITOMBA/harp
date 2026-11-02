"use server";

import prisma from "@/lib/prisma";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const updateMenuRolesSchema = z.object({
  menuId: z.number().int().positive("L'ID du menu est requis"),
  roleIds: z.array(z.number().int().positive("Un rôle sélectionné est invalide")).default([]),
  confirmPublic: z.boolean().default(false),
});

/**
 * Remplace les rôles visibles d'un menu.
 * harpmenurole reçoit l'ensemble coché. harpmenus.role est conservé s'il reste coché,
 * ou passé à null s'il est reconnu et décoché. Le défaut PORTAL_ADMIN n'est jamais rétabli.
 *
 * @param menuId - Identifiant harpmenus
 * @param roleIds - Identifiants harproles cochés
 * @param confirmPublic - Confirmation explicite lorsque l'ensemble vide rend le menu public
 * @returns Succès, ou un refus sans écriture
 */
export async function updateMenuRoles(
  menuId: number,
  roleIds: number[],
  confirmPublic = false
) {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  try {
    const result = updateMenuRolesSchema.safeParse({ menuId, roleIds, confirmPublic });
    if (!result.success) {
      return {
        success: false,
        error: "Données invalides",
        details: result.error.errors,
      };
    }

    const uniqueRoleIds = [...new Set(result.data.roleIds)];
    const menu = await prisma.harpmenus.findUnique({
      where: { id: result.data.menuId },
      select: { id: true, role: true },
    });

    if (!menu) {
      return {
        success: false,
        error: "Menu introuvable",
      };
    }

    const catalog = await prisma.harproles.findMany({
      select: { id: true, role: true },
    });
    const selected = catalog.filter((role) => uniqueRoleIds.includes(role.id));
    if (selected.length !== uniqueRoleIds.length) {
      return {
        success: false,
        error: "Un ou plusieurs rôles sont introuvables",
      };
    }

    const columnRole = menu.role ? String(menu.role).trim() : "";
    const columnKnown = columnRole.length > 0 && catalog.some((role) => role.role === columnRole);
    if (columnRole.length > 0 && !columnKnown) {
      return {
        success: false,
        error: "Ce menu porte une restriction historique non reconnue. L'enregistrement est refusé.",
      };
    }

    if (uniqueRoleIds.length === 0 && !result.data.confirmPublic) {
      return {
        success: false,
        error: "Confirmation requise : ce menu deviendrait visible pour tous les rôles, sans ouvrir les familles RBAC.",
      };
    }

    const selectedNames = new Set(selected.map((role) => role.role));
    const clearColumn = columnKnown && !selectedNames.has(columnRole);

    await prisma.$transaction(async (tx) => {
      await tx.harpmenurole.deleteMany({
        where: { menuId: menu.id },
      });

      if (uniqueRoleIds.length > 0) {
        await tx.harpmenurole.createMany({
          data: uniqueRoleIds.map((roleId) => ({
            menuId: menu.id,
            roleId,
            datmaj: new Date(),
          })),
        });
      }

      if (clearColumn) {
        await tx.harpmenus.update({
          where: { id: menu.id },
          data: { role: null },
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
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

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
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

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

