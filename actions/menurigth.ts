"use server";

import * as z from "zod";
import { toast } from "react-toastify";
import prisma from "@/lib/prisma";
import { useCurrentRole } from "@/hooks/use-current-role";

// Schéma de validation pour l'ID utilisateur
const userSchema = z.object({
  userId: z.number().min(1, "L'ID utilisateur est requis")
});

export async function getUserRoles(userId: number) {

  if (!userId) {
    return [];
  }
  
  try {
    // Validation de l'ID utilisateur
    const result = userSchema.safeParse({ userId });
    if (!result.success) {
      throw new Error("ID utilisateur invalide");
    }

    const userRoles = await prisma.harpuseroles.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        datmaj: 'desc'
      },
      include: {
        harproles: true,
      },
    });

    if (!userRoles || userRoles.length === 0) {
      return ""; // Retourne une chaîne vide si aucun rôle n'est trouvé
    }

    const droitMenus = [...new Set([
      ...userRoles.map(role => `"${role.harproles.role}"`)
    ])].join(', ');

    // const concatRolesMenus = ["HUBERT", "AXEL", "NICOLAS"];
    // const droitMenus = [...new Set([
    //   ...userRoles.map(role => `"${role.harproles.role}"`),
    //   ...concatRolesMenus.map(role => `"${role}"`)
    // ])].join(', ');

    return droitMenus;

  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return ""; // Retourner une chaîne vide en cas d'erreur pour éviter les erreurs 500
  }
}



export async function getMenuRoles(menuId: number) {

  
  try {
    // Validation de l'ID utilisateur
    const result = userSchema.safeParse({ menuId });
    if (!result.success) {
      throw new Error("ID utilisateur invalide");
    }

    const menuRoles = await prisma.harpmenurole.findMany({
      where: {
        menuId: menuId,
      },
      orderBy: {
        datmaj: 'desc'
      },
      include: {
        harproles: true,
      },
    });

    if (!menuRoles || menuRoles.length === 0) {
      return ""; // Retourne une chaîne vide si aucun rôle n'est trouvé
    }

    const droitMenus = [...new Set([
      ...menuRoles.map(role => `"${role.harproles.role}"`)
    ])].join(', ');
    
    return droitMenus;

  } catch (error) {
    console.error("Erreur lors de la récupération des droits pour les menus:", error);
   // throw new Error("Impossible de récupérer les rôles de l'utilisateur");
  }
}