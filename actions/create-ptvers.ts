"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreatePtVersSchema = z.object({
  ptversion: z.string().min(1, "La version est requise").max(50),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function createPtVers(formData: FormData) {
  try {
    const rawData = {
      ptversion: formData.get("ptversion") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = CreatePtVersSchema.parse(rawData);

    const existingVersion = await db.psadm_ptools.findUnique({
      where: { ptversion: validatedData.ptversion },
    });

    if (existingVersion) {
      return { success: false, error: "Une version avec ce nom existe déjà" };
    }

    const newVersion = await db.psadm_ptools.create({
      data: {
        ptversion: validatedData.ptversion,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `La version ${validatedData.ptversion} a été créée avec succès`,
      ptversion: newVersion.ptversion
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de la version:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de la version" 
    };
  } finally {
    revalidatePath("/list/ptvers");
  }
}

