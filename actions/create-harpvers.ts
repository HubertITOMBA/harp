"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateHarpVersSchema = z.object({
  harprelease: z.string().min(1, "La release est requise").max(20),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function createHarpVers(formData: FormData) {
  try {
    const rawData = {
      harprelease: formData.get("harprelease") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = CreateHarpVersSchema.parse(rawData);

    const existingRelease = await db.psadm_release.findUnique({
      where: { harprelease: validatedData.harprelease },
    });

    if (existingRelease) {
      return { success: false, error: "Une release avec ce nom existe déjà" };
    }

    const newRelease = await db.psadm_release.create({
      data: {
        harprelease: validatedData.harprelease,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `La release ${validatedData.harprelease} a été créée avec succès`,
      harprelease: newRelease.harprelease
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de la release:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de la release" 
    };
  } finally {
    revalidatePath("/list/harpvers");
  }
}

