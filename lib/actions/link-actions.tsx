"use server"

import { db } from "@/lib/db";

export async function getLinkById(link: string, typlink: string, tab: string) {
  try {
    const linkData = await db.psadm_link.findFirst({
      where: {
        link,
        typlink,
        tab,
      },
    });

    return linkData;
  } catch (error) {
    console.error("Erreur lors de la récupération du lien:", error);
    return null;
  }
}

