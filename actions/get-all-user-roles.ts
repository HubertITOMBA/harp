"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Récupère tous les rôles d'un utilisateur en fusionnant :
 * - Le rôle principal de la table User (User.role)
 * - Les rôles de harproles via harpuseroles
 * 
 * @returns Array de strings contenant tous les rôles uniques de l'utilisateur
 */
export async function getAllUserRoles() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return [];
    }

    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      console.error("[getAllUserRoles] ID utilisateur invalide:", session.user.id);
      return [];
    }

    // Récupérer l'utilisateur avec son rôle principal et ses rôles harp
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        harpuseroles: {
          include: {
            harproles: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Collecter tous les rôles dans un Set pour éviter les doublons
    const rolesSet = new Set<string>();

    // 1. Ajouter le rôle principal de la table User (User.role)
    // Conversion explicite en string pour garantir la compatibilité
    if (user.role) {
      rolesSet.add(String(user.role));
    }

    // 2. Ajouter les rôles depuis harproles via harpuseroles
    if (user.harpuseroles && user.harpuseroles.length > 0) {
      user.harpuseroles.forEach((userRole) => {
        if (userRole.harproles?.role) {
          // Conversion explicite en string
          rolesSet.add(String(userRole.harproles.role));
        }
      });
    }

    // Convertir le Set en array et retourner les rôles triés
    const allRoles = Array.from(rolesSet).sort();
    
    console.log(`[getAllUserRoles] Rôles fusionnés pour userId ${userId}:`, allRoles);
    
    return allRoles;
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return [];
  }
}

