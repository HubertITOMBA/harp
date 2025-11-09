"use server"

import { db } from "@/lib/db";

export async function getJournalById(num: number) {
  try {
    const log = await db.psadm_log.findUnique({
      where: { num },
    });

    return log;
  } catch (error) {
    console.error("Erreur lors de la récupération du log:", error);
    return null;
  }
}

