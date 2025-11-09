"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateTypeServSchema = z.object({
  typsrv: z.string().min(1, "Le type de service est requis").max(8),
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function createTypeServ(formData: FormData) {
  try {
    const rawData = {
      typsrv: formData.get("typsrv") as string,
      descr: formData.get("descr") as string,
    };

    const validatedData = CreateTypeServSchema.parse(rawData);

    const existingTypeServ = await db.psadm_typsrv.findUnique({
      where: { typsrv: validatedData.typsrv },
    });

    if (existingTypeServ) {
      return { success: false, error: "Un type de service avec ce nom existe déjà" };
    }

    const newTypeServ = await db.psadm_typsrv.create({
      data: {
        typsrv: validatedData.typsrv,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Le type de service ${validatedData.typsrv} a été créé avec succès`,
      typsrv: newTypeServ.typsrv
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du type de service:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du type de service" 
    };
  } finally {
    revalidatePath("/list/tpserv");
  }
}

