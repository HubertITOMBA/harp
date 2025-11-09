"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateAppliSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function updateAppli(appli: string, psversion: string, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdateAppliSchema.parse(rawData);

    const existingAppli = await db.psadm_appli.findUnique({
      where: {
        appli_psversion: {
          appli: appli,
          psversion: psversion,
        },
      },
    });

    if (!existingAppli) {
      return { success: false, error: "Application non trouvée" };
    }

    await db.psadm_appli.update({
      where: {
        appli_psversion: {
          appli: appli,
          psversion: psversion,
        },
      },
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `L'application ${existingAppli.appli} (${existingAppli.psversion}) a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'application:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'application" 
    };
  } finally {
    revalidatePath("/list/appli");
  }
}

