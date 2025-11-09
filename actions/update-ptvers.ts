"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdatePtVersSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function updatePtVers(ptversion: string, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdatePtVersSchema.parse(rawData);

    const existingVersion = await db.psadm_ptools.findUnique({
      where: { ptversion },
    });

    if (!existingVersion) {
      return { success: false, error: "Version non trouvée" };
    }

    await db.psadm_ptools.update({
      where: { ptversion },
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `La version ${existingVersion.ptversion} a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de la version:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de la version" 
    };
  } finally {
    revalidatePath("/list/ptvers");
    revalidatePath(`/list/ptvers/${ptversion}`);
  }
}

