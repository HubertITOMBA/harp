"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateTypeStatusSchema = z.object({
  statenv: z.string().min(1, "Le statut est requis").max(32),
  descr: z.string().max(70).optional().or(z.literal("")),
  icone: z.string().max(70).optional().or(z.literal("")),
});

export async function createTypeStatus(formData: FormData) {
  try {
    const rawData = {
      statenv: formData.get("statenv") as string,
      descr: formData.get("descr") as string || undefined,
      icone: formData.get("icone") as string || undefined,
    };

    const validatedData = CreateTypeStatusSchema.parse(rawData);

    const existingTypeStatus = await db.statutenv.findUnique({
      where: { statenv: validatedData.statenv },
    });

    if (existingTypeStatus) {
      return { success: false, error: "Un statut avec ce nom existe déjà" };
    }

    const newTypeStatus = await db.statutenv.create({
      data: {
        statenv: validatedData.statenv,
        descr: validatedData.descr || null,
        icone: validatedData.icone || null,
      },
    });

    return { 
      success: true, 
      message: `Le statut ${validatedData.statenv} a été créé avec succès`,
      id: newTypeStatus.id
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du statut:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du statut" 
    };
  } finally {
    revalidatePath("/list/tpstatus");
  }
}

