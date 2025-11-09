"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateServRoleSchema = z.object({
  srv: z.string().min(1, "Le serveur est requis").max(32),
  env: z.string().min(1, "L'environnement est requis").max(32),
  typsrv: z.string().min(1, "Le type de serveur est requis").max(32),
  status: z.coerce.number().int().optional().nullable(),
});

export async function updateServRole(
  originalSrv: string,
  originalEnv: string,
  originalTypsrv: string,
  formData: FormData
) {
  try {
    const rawData = {
      srv: formData.get("srv") as string,
      env: formData.get("env") as string,
      typsrv: formData.get("typsrv") as string,
      status: formData.get("status") ? formData.get("status") : null,
    };

    const validatedData = UpdateServRoleSchema.parse(rawData);

    // Si les clés primaires changent, vérifier qu'il n'existe pas déjà
    if (
      originalSrv !== validatedData.srv ||
      originalEnv !== validatedData.env ||
      originalTypsrv !== validatedData.typsrv
    ) {
      const existingServRole = await db.psadm_rolesrv.findFirst({
        where: {
          srv: validatedData.srv,
          env: validatedData.env,
          typsrv: validatedData.typsrv,
        },
      });

      if (existingServRole) {
        return { success: false, error: "Ce rôle serveur existe déjà" };
      }
    }

    // Supprimer l'ancien enregistrement et créer le nouveau
    // (Prisma ne supporte pas directement la mise à jour d'une clé primaire composite)
    await db.psadm_rolesrv.deleteMany({
      where: {
        srv: originalSrv,
        env: originalEnv,
        typsrv: originalTypsrv,
      },
    });

    await db.psadm_rolesrv.create({
      data: {
        srv: validatedData.srv,
        env: validatedData.env,
        typsrv: validatedData.typsrv,
        status: validatedData.status,
      },
    });

    return { 
      success: true, 
      message: `Le rôle serveur a été mis à jour avec succès`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du rôle serveur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du rôle serveur" 
    };
  } finally {
    revalidatePath("/list/servrole");
  }
}

