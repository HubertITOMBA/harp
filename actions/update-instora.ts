"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InstSchema } from "@/schemas";

export async function updateInstOra(instanceId: number, formData: FormData) {
  try {
    const rawData = {
      oracle_sid: formData.get("oracle_sid") as string,
      serverId: formData.get("serverId") ? Number(formData.get("serverId")) : null,
      typebaseId: formData.get("typebaseId") ? Number(formData.get("typebaseId")) : null,
      descr: formData.get("descr") as string,
    };

    const validatedData = InstSchema.parse(rawData);

    const existingInstance = await db.harpinstance.findUnique({
      where: { id: instanceId },
    });

    if (!existingInstance) {
      return { success: false, error: "Instance non trouvée" };
    }

    // Vérifier si le SID Oracle change et s'il existe déjà
    if (validatedData.oracle_sid !== existingInstance.oracle_sid) {
      const duplicateInstance = await db.harpinstance.findUnique({
        where: { oracle_sid: validatedData.oracle_sid },
      });
      if (duplicateInstance) {
        return { success: false, error: "Une instance avec ce SID Oracle existe déjà" };
      }
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

    await db.harpinstance.update({
      where: { id: instanceId },
      data: {
        oracle_sid: validatedData.oracle_sid,
        serverId: validatedData.serverId,
        typebaseId: validatedData.typebaseId,
        descr: validatedData.descr,
      },
    });

    return { 
      success: true, 
      message: `L'instance ${validatedData.oracle_sid} a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'instance:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'instance" 
    };
  } finally {
    revalidatePath("/list/instora");
    revalidatePath(`/list/instora/${instanceId}`);
  }
}

