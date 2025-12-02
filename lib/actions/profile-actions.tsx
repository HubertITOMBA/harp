"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Récupère les données complètes du profil utilisateur avec ses rôles
 * 
 * @returns Les données utilisateur avec ses rôles HARP ou null si non connecté
 */
export async function getUserProfile() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      console.error("[getUserProfile] ID utilisateur invalide:", session.user.id);
      return null;
    }

    // Récupérer l'utilisateur avec ses rôles HARP
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        netid: true,
        role: true,
        nom: true,
        prenom: true,
        pkeyfile: true,
        harpuseroles: {
          include: {
            harproles: {
              select: {
                id: true,
                role: true,
                descr: true,
              },
            },
          },
          orderBy: {
            datmaj: 'desc',
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    return null;
  }
}

