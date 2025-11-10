"use server";

import { db } from "@/lib/db";

/**
 * Récupère une attribution de rôle HARP par netid et role
 */
export async function getUserRolesById(netid: string, role: string) {
  // Récupérer l'utilisateur
  const user = await db.user.findUnique({
    where: { netid },
    select: {
      id: true,
      netid: true,
      nom: true,
      prenom: true,
      email: true,
    }
  });

  if (!user) {
    return null;
  }

  // Récupérer le rôle
  const harprole = await db.harproles.findUnique({
    where: { role },
    select: {
      id: true,
      role: true,
      descr: true,
    }
  });

  if (!harprole) {
    return null;
  }

  // Récupérer l'attribution
  const userRole = await db.harpuseroles.findFirst({
    where: {
      userId: user.id,
      roleId: harprole.id,
    },
    select: {
      datmaj: true,
    }
  });

  if (!userRole) {
    return null;
  }

  // Retourner dans un format compatible avec l'ancienne structure
  return {
    netid: user.netid || "",
    role: harprole.role,
    rolep: "N", // La table harpuseroles n'a pas de champ rolep
    datmaj: userRole.datmaj,
    // Adapter pour la compatibilité avec ViewUserRolesContent
    user: {
      netid: user.netid || "",
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
    },
    harprole: {
      role: harprole.role,
      descr: harprole.descr,
    }
  };
}

