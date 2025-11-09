"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateHarParamSchema = z.object({
  param: z.string().min(1, "Le paramètre est requis").max(12),
  valeur: z.string().min(1, "La valeur est requise").max(100),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function createHarParam(formData: FormData) {
  try {
    const rawData = {
      param: formData.get("param") as string,
      valeur: formData.get("valeur") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = CreateHarParamSchema.parse(rawData);

    // Vérifier si le paramètre existe déjà
    const existingParam = await db.psadm_param.findUnique({
      where: { param: validatedData.param },
    });

    if (existingParam) {
      return { success: false, error: "Un paramètre avec ce nom existe déjà" };
    }

    const newParam = await db.psadm_param.create({
      data: {
        param: validatedData.param,
        valeur: validatedData.valeur,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Le paramètre ${validatedData.param} a été créé avec succès`,
      param: newParam.param
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du paramètre:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du paramètre" 
    };
  } finally {
    revalidatePath("/list/harparam");
  }
}

