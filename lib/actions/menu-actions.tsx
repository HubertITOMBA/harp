"use server"

import { db } from "@/lib/db";

export async function getMenuById(id: number) {
  try {
    const menu = await db.harpmenus.findUnique({
      where: {
        id,
      },
      include: {
        harpmenurole: {
          include: {
            harproles: {
              select: {
                id: true,
                role: true,
                descr: true,
              },
            },
          },
        },
      },
    });

    return menu;
  } catch (error) {
    console.error("Erreur lors de la récupération du menu:", error);
    return null;
  }
}

export async function getAllRoles() {
  try {
    const roles = await db.psadm_role.findMany({
      orderBy: {
        role: 'asc',
      },
      select: {
        role: true,
        descr: true,
      },
    });

    return roles;
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return [];
  }
}

/**
 * Récupère tous les rôles HARP (harproles) avec leurs IDs
 * 
 * @returns Un tableau de rôles HARP avec id, role et descr
 */
export async function getAllHarpRoles() {
  try {
    const roles = await db.harproles.findMany({
      orderBy: {
        role: 'asc',
      },
      select: {
        id: true,
        role: true,
        descr: true,
      },
    });

    return roles;
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles HARP:", error);
    return [];
  }
}

