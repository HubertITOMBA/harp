"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateUserRolesSchema = z.object({
  netid: z.string().min(1, "Le NetID est requis").max(32),
  role: z.string().min(1, "Le rôle est requis").max(32),
  rolep: z.string().length(1, "Le rôle principal doit être un caractère").default("Y"),
});

export async function createUserRoles(formData: FormData) {
  try {
    const rawData = {
      netid: formData.get("netid") as string,
      role: formData.get("role") as string,
      rolep: (formData.get("rolep") as string) || "Y",
    };

    const validatedData = CreateUserRolesSchema.parse(rawData);

    // Vérifier que l'utilisateur existe
    const user = await db.psadm_user.findUnique({
      where: { netid: validatedData.netid },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Vérifier que le rôle existe
    const role = await db.psadm_role.findUnique({
      where: { role: validatedData.role },
    });

    if (!role) {
      return { success: false, error: "Rôle non trouvé" };
    }

    // Vérifier si l'attribution existe déjà
    const existingUserRole = await db.psadm_roleuser.findFirst({
      where: {
        netid: validatedData.netid,
        role: validatedData.role,
      },
    });

    if (existingUserRole) {
      return { success: false, error: "Cette attribution de rôle existe déjà" };
    }

    const newUserRole = await db.psadm_roleuser.create({
      data: {
        netid: validatedData.netid,
        role: validatedData.role,
        rolep: validatedData.rolep,
      },
    });

    return { 
      success: true, 
      message: `Le rôle ${validatedData.role} a été attribué à ${validatedData.netid} avec succès`,
      netid: newUserRole.netid,
      role: newUserRole.role
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'attribution de rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'attribution de rôle" 
    };
  } finally {
    revalidatePath("/list/useroles");
  }
}

