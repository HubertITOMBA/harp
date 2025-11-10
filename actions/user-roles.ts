"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Ajouter un ou plusieurs rôles HARP à un utilisateur
 */
export async function addUserRoles(netid: string, roles: string[]) {
  try {
    if (!netid || !roles || roles.length === 0) {
      return { 
        success: false, 
        error: "NetID et rôles sont requis" 
      };
    }

    // Vérifier que l'utilisateur existe dans la table User
    const user = await prisma.user.findUnique({
      where: { netid: netid },
      select: { id: true }
    });

    if (!user) {
      return { 
        success: false, 
        error: "Utilisateur non trouvé" 
      };
    }

    // Vérifier que les rôles existent dans harproles
    const existingRoles = await prisma.harproles.findMany({
      where: {
        role: { in: roles }
      },
      select: { id: true, role: true }
    });

    if (existingRoles.length !== roles.length) {
      return { 
        success: false, 
        error: "Un ou plusieurs rôles n'existent pas" 
      };
    }

    // Récupérer les rôles déjà attribués
    const existingUserRoles = await prisma.harpuseroles.findMany({
      where: {
        userId: user.id,
        roleId: { in: existingRoles.map(r => r.id) }
      },
      select: { roleId: true }
    });

    const existingRoleIds = new Set(existingUserRoles.map(ur => ur.roleId));
    const rolesToAdd = existingRoles.filter(role => !existingRoleIds.has(role.id));

    if (rolesToAdd.length === 0) {
      return { 
        success: false, 
        error: "Tous les rôles sélectionnés sont déjà attribués à cet utilisateur" 
      };
    }

    // Ajouter les nouveaux rôles
    await prisma.harpuseroles.createMany({
      data: rolesToAdd.map(role => ({
        userId: user.id,
        roleId: role.id
      })),
      skipDuplicates: true
    });

    revalidatePath(`/list/users/${netid}`);
    
    return { 
      success: true, 
      message: `${rolesToAdd.length} rôle(s) ajouté(s) avec succès` 
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout des rôles:", error);
    return { 
      success: false, 
      error: "Erreur lors de l'ajout des rôles" 
    };
  }
}

/**
 * Retirer un rôle HARP d'un utilisateur
 */
export async function removeUserRole(netid: string, role: string) {
  try {
    if (!netid || !role) {
      return { 
        success: false, 
        error: "NetID et rôle sont requis" 
      };
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { netid: netid },
      select: { id: true }
    });

    if (!user) {
      return { 
        success: false, 
        error: "Utilisateur non trouvé" 
      };
    }

    // Récupérer le rôle
    const harprole = await prisma.harproles.findUnique({
      where: { role: role },
      select: { id: true }
    });

    if (!harprole) {
      return { 
        success: false, 
        error: "Rôle non trouvé" 
      };
    }

    // Supprimer l'association
    const deleted = await prisma.harpuseroles.deleteMany({
      where: {
        userId: user.id,
        roleId: harprole.id
      }
    });

    if (deleted.count === 0) {
      return { 
        success: false, 
        error: "Ce rôle n'est pas attribué à cet utilisateur" 
      };
    }

    revalidatePath(`/list/users/${netid}`);
    
    return { 
      success: true, 
      message: "Rôle retiré avec succès" 
    };
  } catch (error) {
    console.error("Erreur lors du retrait du rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors du retrait du rôle" 
    };
  }
}

/**
 * Récupérer tous les rôles HARP disponibles
 */
export async function getAllAvailableRoles() {
  try {
    const roles = await prisma.harproles.findMany({
      orderBy: {
        role: 'asc'
      },
      select: {
        id: true,
        role: true,
        descr: true
      }
    });

    return { 
      success: true, 
      data: roles 
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return { 
      success: false, 
      error: "Erreur lors de la récupération des rôles",
      data: [] 
    };
  }
}

