"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateRoleSchema = z.object({
  descr: z.string().min(1, "La description est requise").max(50),
  slug: z.string().max(32).optional().or(z.literal("")),
});

export async function updateRole(roleId: number, formData: FormData) {
  try {
    const rawData = {
      descr: formData.get("descr") as string,
      slug: formData.get("slug") as string || undefined,
    };

    const validatedData = UpdateRoleSchema.parse(rawData);

    const existingRole = await db.harproles.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return { success: false, error: "Rôle non trouvé" };
    }

    await db.harproles.update({
      where: { id: roleId },
      data: {
        descr: validatedData.descr,
        slug: validatedData.slug || null,
      },
    });

    return { 
      success: true, 
      message: `Le rôle ${existingRole.role} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du rôle" 
    };
  } finally {
    revalidatePath("/list/roles");
    revalidatePath(`/list/roles/${roleId}`);
  }
}

