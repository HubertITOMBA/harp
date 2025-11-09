"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateAppliSchema = z.object({
  appli: z.string().min(1, "L'application est requise").max(2),
  psversion: z.string().min(1, "La version Psoft est requise").max(50),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function createAppli(formData: FormData) {
  try {
    const rawData = {
      appli: formData.get("appli") as string,
      psversion: formData.get("psversion") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = CreateAppliSchema.parse(rawData);

    const existingAppli = await db.psadm_appli.findUnique({
      where: {
        appli_psversion: {
          appli: validatedData.appli,
          psversion: validatedData.psversion,
        },
      },
    });

    if (existingAppli) {
      return { success: false, error: "Une application avec ce code et cette version existe déjà" };
    }

    await db.psadm_appli.create({
      data: {
        appli: validatedData.appli,
        psversion: validatedData.psversion,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `L'application ${validatedData.appli} (${validatedData.psversion}) a été créée avec succès`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'application:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'application" 
    };
  } finally {
    revalidatePath("/list/appli");
  }
}

