"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateRoleSchema = z.object({
  role: z.string().min(1, "Le nom du rôle est requis").max(32),
  descr: z.string().min(1, "La description est requise").max(50),
  slug: z.string().max(32).optional().or(z.literal("")),
});

export async function createRole(formData: FormData) {
  try {
    const rawData = {
      role: formData.get("role") as string,
      descr: formData.get("descr") as string,
      slug: formData.get("slug") as string || undefined,
    };

    const validatedData = CreateRoleSchema.parse(rawData);

    const existingRole = await db.harproles.findFirst({
      where: { role: validatedData.role },
    });

    if (existingRole) {
      return { success: false, error: "Un rôle avec ce nom existe déjà" };
    }

    const newRole = await db.harproles.create({
      data: {
        role: validatedData.role,
        descr: validatedData.descr,
        slug: validatedData.slug || null,
      },
    });

    return { 
      success: true, 
      message: `Le rôle ${validatedData.role} a été créé avec succès`,
      id: newRole.id
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du rôle" 
    };
  } finally {
    revalidatePath("/list/roles");
  }
}

