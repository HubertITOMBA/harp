"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateServerSchema = z.object({
  srv: z.string().min(1, "Le nom du serveur est requis").max(32),
  ip: z.string().min(1, "L'adresse IP est requise").max(15),
  pshome: z.string().min(1, "PS Home est requis").max(32),
  os: z.string().max(15).optional().or(z.literal("")),
  psuser: z.string().max(15).optional().or(z.literal("")),
  domain: z.string().max(10).optional().or(z.literal("")),
  statenvId: z.string().optional(),
});

export async function createServer(formData: FormData) {
  try {
    const rawData = {
      srv: formData.get("srv") as string,
      ip: formData.get("ip") as string,
      pshome: formData.get("pshome") as string,
      os: formData.get("os") as string || undefined,
      psuser: formData.get("psuser") as string || undefined,
      domain: formData.get("domain") as string || undefined,
      statenvId: formData.get("statenvId") as string || undefined,
    };

    const validatedData = CreateServerSchema.parse(rawData);

    // Vérifier si le serveur existe déjà
    const existingServer = await db.harpserve.findFirst({
      where: { srv: validatedData.srv },
    });

    if (existingServer) {
      return { success: false, error: "Un serveur avec ce nom existe déjà" };
    }

    // Convertir l'ID de statut si présent
    const statenvId = validatedData.statenvId ? parseInt(validatedData.statenvId) : 4; // Statut par défaut

    // Créer le serveur
    await db.harpserve.create({
      data: {
        srv: validatedData.srv,
        ip: validatedData.ip,
        pshome: validatedData.pshome,
        os: validatedData.os || null,
        psuser: validatedData.psuser || null,
        domain: validatedData.domain || null,
        statenvId: statenvId,
      },
    });

    return { 
      success: true, 
      message: `Le serveur ${validatedData.srv} a été créé avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du serveur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du serveur" 
    };
  } finally {
    revalidatePath("/list/servers");
  }
}

