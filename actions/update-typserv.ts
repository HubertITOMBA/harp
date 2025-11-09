"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateTypeServSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(50),
});

export async function updateTypeServ(typsrv: string, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
    };

    const validatedData = UpdateTypeServSchema.parse(rawData);

    const existingTypeServ = await db.psadm_typsrv.findUnique({
      where: { typsrv },
    });

    if (!existingTypeServ) {
      return { success: false, error: "Type de service non trouvé" };
    }

    await db.psadm_typsrv.update({
      where: { typsrv },
      data: {
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `Le type de service ${existingTypeServ.typsrv} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du type de service:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du type de service" 
    };
  } finally {
    revalidatePath("/list/tpserv");
    revalidatePath(`/list/tpserv/${typsrv}`);
  }
}

