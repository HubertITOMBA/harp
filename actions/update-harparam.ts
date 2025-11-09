"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateHarParamSchema = z.object({
  valeur: z.string().min(1, "La valeur est requise").max(100),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function updateHarParam(param: string, formData: FormData) {
  try {
    const rawData = {
      valeur: formData.get("valeur") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdateHarParamSchema.parse(rawData);

    const existingParam = await db.psadm_param.findUnique({
      where: { param },
    });

    if (!existingParam) {
      return { success: false, error: "Paramètre non trouvé" };
    }

    await db.psadm_param.update({
      where: { param },
      data: {
        valeur: validatedData.valeur,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Le paramètre ${param} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du paramètre:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du paramètre" 
    };
  } finally {
    revalidatePath("/list/harparam");
  }
}

