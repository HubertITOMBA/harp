"use server"

import { db } from "@/lib/db";

export async function getInstOraById(id: number) {
  try {
    const instance = await db.harpinstance.findUnique({
      where: { id },
      include: {
        harpserve: {
          include: {
            statutenv: true,
          },
        },
        harptypebase: true,
        envsharp: {
          include: {
            statutenv: true,
          },
        },
      },
    });

    return instance;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'instance:", error);
    return null;
  }
}

