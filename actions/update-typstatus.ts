"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateTypeStatusSchema = z.object({
  descr: z.string().max(70).optional().or(z.literal("")),
  icone: z.string().max(70).optional().or(z.literal("")),
});

export async function updateTypeStatus(id: number, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string || undefined,
      icone: formData.get("icone") as string || undefined,
    };

    const validatedData = UpdateTypeStatusSchema.parse(rawData);

    const existingTypeStatus = await db.statutenv.findUnique({
      where: { id },
    });

    if (!existingTypeStatus) {
      return { success: false, error: "Statut non trouvé" };
    }

    await db.statutenv.update({
      where: { id },
      data: {
        descr: validatedData.descr || null,
        icone: validatedData.icone || null,
      },
    });

    return { 
      success: true, 
      message: `Le statut ${existingTypeStatus.statenv} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du statut:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du statut" 
    };
  } finally {
    revalidatePath("/list/tpstatus");
    revalidatePath(`/list/tpstatus/${id}`);
  }
}

