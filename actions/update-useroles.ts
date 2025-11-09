"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateUserRolesSchema = z.object({
  rolep: z.string().length(1, "Le rôle principal doit être un caractère"),
});

export async function updateUserRoles(netid: string, role: string, formData: FormData) {
  try {
    const rawData = {
      rolep: formData.get("rolep") as string || "Y",
    };

    const validatedData = UpdateUserRolesSchema.parse(rawData);

    const existingUserRole = await db.psadm_roleuser.findFirst({
      where: {
        netid,
        role,
      },
    });

    if (!existingUserRole) {
      return { success: false, error: "Attribution de rôle non trouvée" };
    }

    await db.psadm_roleuser.updateMany({
      where: {
        netid,
        role,
      },
      data: {
        rolep: validatedData.rolep,
      },
    });

    return { 
      success: true, 
      message: `L'attribution de rôle a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'attribution de rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'attribution de rôle" 
    };
  } finally {
    revalidatePath("/list/useroles");
    revalidatePath(`/list/useroles/${netid}`);
  }
}

