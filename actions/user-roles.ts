"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Ajouter un ou plusieurs rôles à un utilisateur
 */
export async function addUserRoles(netid: string, roles: string[]) {
  try {
    if (!netid || !roles || roles.length === 0) {
      return { 
        success: false, 
        error: "NetID et rôles sont requis" 
      };
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.psadm_user.findUnique({
      where: { netid: netid }
    });

    if (!user) {
      return { 
        success: false, 
        error: "Utilisateur non trouvé" 
      };
    }

    // Vérifier que les rôles existent
    const existingRoles = await prisma.psadm_role.findMany({
      where: {
        role: { in: roles }
      }
    });

    if (existingRoles.length !== roles.length) {
      return { 
        success: false, 
        error: "Un ou plusieurs rôles n'existent pas" 
      };
    }

    // Récupérer les rôles déjà attribués
    const existingUserRoles = await prisma.psadm_roleuser.findMany({
      where: {
        netid: netid,
        role: { in: roles }
      }
    });

    const existingRoleNames = existingUserRoles.map(ur => ur.role);
    const newRoles = roles.filter(role => !existingRoleNames.includes(role));

    if (newRoles.length === 0) {
      return { 
        success: false, 
        error: "Tous les rôles sélectionnés sont déjà attribués à cet utilisateur" 
      };
    }

    // Ajouter les nouveaux rôles
    const rolepValue = "Y"; // Valeur par défaut pour rolep
    await prisma.psadm_roleuser.createMany({
      data: newRoles.map(role => ({
        netid: netid,
        role: role,
        rolep: rolepValue
      })),
      skipDuplicates: true
    });

    revalidatePath(`/list/users/${netid}`);
    
    return { 
      success: true, 
      message: `${newRoles.length} rôle(s) ajouté(s) avec succès` 
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
 * Retirer un rôle d'un utilisateur
 */
export async function removeUserRole(netid: string, role: string) {
  try {
    if (!netid || !role) {
      return { 
        success: false, 
        error: "NetID et rôle sont requis" 
      };
    }

    // Vérifier que l'association existe et la supprimer
    const deleted = await prisma.psadm_roleuser.deleteMany({
      where: {
        netid: netid,
        role: role
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
 * Récupérer tous les rôles disponibles
 */
export async function getAllAvailableRoles() {
  try {
    const roles = await prisma.psadm_role.findMany({
      orderBy: {
        role: 'asc'
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

