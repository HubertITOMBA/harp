"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateHarpVersSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function updateHarpVers(harprelease: string, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdateHarpVersSchema.parse(rawData);

    const existingRelease = await db.psadm_release.findUnique({
      where: { harprelease },
    });

    if (!existingRelease) {
      return { success: false, error: "Release non trouvée" };
    }

    await db.psadm_release.update({
      where: { harprelease },
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `La release ${existingRelease.harprelease} a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de la release:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de la release" 
    };
  } finally {
    revalidatePath("/list/harpvers");
    revalidatePath(`/list/harpvers/${harprelease}`);
  }
}

