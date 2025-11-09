"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateServRoleSchema = z.object({
  srv: z.string().min(1, "Le serveur est requis").max(32),
  env: z.string().min(1, "L'environnement est requis").max(32),
  typsrv: z.string().min(1, "Le type de serveur est requis").max(32),
  status: z.coerce.number().int().optional().nullable(),
});

export async function createServRole(formData: FormData) {
  try {
    const rawData = {
      srv: formData.get("srv") as string,
      env: formData.get("env") as string,
      typsrv: formData.get("typsrv") as string,
      status: formData.get("status") ? formData.get("status") : null,
    };

    const validatedData = CreateServRoleSchema.parse(rawData);

    // Vérifier que le serveur existe
    const server = await db.psadm_srv.findUnique({
      where: { srv: validatedData.srv },
    });

    if (!server) {
      return { success: false, error: "Serveur non trouvé" };
    }

    // Vérifier que l'environnement existe
    const env = await db.psadm_env.findUnique({
      where: { env: validatedData.env },
    });

    if (!env) {
      return { success: false, error: "Environnement non trouvé" };
    }

    // Vérifier que le type de serveur existe
    const typsrv = await db.psadm_typsrv.findUnique({
      where: { typsrv: validatedData.typsrv },
    });

    if (!typsrv) {
      return { success: false, error: "Type de serveur non trouvé" };
    }

    // Vérifier si le rôle serveur existe déjà
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

    const newServRole = await db.psadm_rolesrv.create({
      data: {
        srv: validatedData.srv,
        env: validatedData.env,
        typsrv: validatedData.typsrv,
        status: validatedData.status,
      },
    });

    return { 
      success: true, 
      message: `Le rôle serveur a été créé avec succès`,
      srv: newServRole.srv,
      env: newServRole.env,
      typsrv: newServRole.typsrv,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du rôle serveur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du rôle serveur" 
    };
  } finally {
    revalidatePath("/list/servrole");
  }
}

