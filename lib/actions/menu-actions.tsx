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

