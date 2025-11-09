"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertInstSchema } from "@/schemas";

export async function createInstOra(formData: FormData) {
  try {
    const rawData = {
      oracle_sid: formData.get("oracle_sid") as string,
      serverId: formData.get("serverId") ? Number(formData.get("serverId")) : null,
      typebaseId: formData.get("typebaseId") ? Number(formData.get("typebaseId")) : null,
      descr: formData.get("descr") as string,
    };

    const validatedData = insertInstSchema.parse(rawData);

    // Vérifier si l'instance existe déjà
    const existingInstance = await db.harpinstance.findUnique({
      where: { oracle_sid: validatedData.oracle_sid },
    });

    if (existingInstance) {
      return { success: false, error: "Une instance avec ce SID Oracle existe déjà" };
    }

    // Vérifier que le serveur existe
    if (validatedData.serverId) {
      const server = await db.harpserve.findUnique({
        where: { id: validatedData.serverId },
      });
      if (!server) {
        return { success: false, error: "Le serveur sélectionné n'existe pas" };
      }
    }

    // Vérifier que le type de base existe
    if (validatedData.typebaseId) {
      const typebase = await db.harptypebase.findUnique({
        where: { id: validatedData.typebaseId },
      });
      if (!typebase) {
        return { success: false, error: "Le type de base sélectionné n'existe pas" };
      }
    }

    const newInstance = await db.harpinstance.create({
      data: {
        oracle_sid: validatedData.oracle_sid,
        serverId: validatedData.serverId,
        typebaseId: validatedData.typebaseId,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `L'instance ${validatedData.oracle_sid} a été créée avec succès`,
      id: newInstance.id
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'instance:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'instance" 
    };
  } finally {
    revalidatePath("/list/instora");
  }
}

