"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateEnvSchema = z.object({
  env: z.string().min(1, "Le nom de l'environnement est requis"),
  aliasql: z.string().max(32).optional().or(z.literal("")),
  oraschema: z.string().max(8).optional().or(z.literal("")),
  orarelease: z.string().max(32).optional().or(z.literal("")),
  url: z.string().max(255).optional().or(z.literal("")),
  appli: z.string().max(2).optional().or(z.literal("")),
  psversion: z.string().max(50).optional().or(z.literal("")),
  ptversion: z.string().max(50).optional().or(z.literal("")),
  harprelease: z.string().max(20).optional().or(z.literal("")),
  pshome: z.string().max(32).optional().or(z.literal("")),
  volum: z.string().max(60).optional().or(z.literal("")),
  descr: z.string().max(255).optional().or(z.literal("")),
  anonym: z.string().max(1).optional().or(z.literal("")),
  edi: z.string().max(1).optional().or(z.literal("")),
  typenvid: z.string().optional(),
  statenvId: z.string().optional(),
});

export async function updateEnv(env: string, formData: FormData) {
  try {
    const rawData = {
      aliasql: formData.get("aliasql") as string || undefined,
      oraschema: formData.get("oraschema") as string || undefined,
      orarelease: formData.get("orarelease") as string || undefined,
      url: formData.get("url") as string || undefined,
      appli: formData.get("appli") as string || undefined,
      psversion: formData.get("psversion") as string || undefined,
      ptversion: formData.get("ptversion") as string || undefined,
      harprelease: formData.get("harprelease") as string || undefined,
      pshome: formData.get("pshome") as string || undefined,
      volum: formData.get("volum") as string || undefined,
      descr: formData.get("descr") as string || undefined,
      anonym: formData.get("anonym") as string || undefined,
      edi: formData.get("edi") as string || undefined,
      typenvid: formData.get("typenvid") as string || undefined,
      statenvId: formData.get("statenvId") as string || undefined,
    };

    const validatedData = UpdateEnvSchema.parse({ env, ...rawData });

    // Vérifier si l'environnement existe
    const existingEnv = await db.envsharp.findUnique({
      where: { env },
    });

    if (!existingEnv) {
      return { success: false, error: "Environnement non trouvé" };
    }

    // Convertir les IDs si présents
    const typenvid = validatedData.typenvid ? parseInt(validatedData.typenvid) : null;
    const statenvId = validatedData.statenvId ? parseInt(validatedData.statenvId) : null;

    // Mettre à jour l'environnement
    await db.envsharp.update({
      where: { env },
      data: {
        aliasql: validatedData.aliasql || null,
        oraschema: validatedData.oraschema || null,
        orarelease: validatedData.orarelease || null,
        url: validatedData.url || null,
        appli: validatedData.appli || null,
        psversion: validatedData.psversion || null,
        ptversion: validatedData.ptversion || null,
        harprelease: validatedData.harprelease || null,
        pshome: validatedData.pshome || null,
        volum: validatedData.volum || null,
        descr: validatedData.descr || null,
        anonym: validatedData.anonym || null,
        edi: validatedData.edi || null,
        typenvid: typenvid !== null ? typenvid : existingEnv.typenvid,
        statenvId: statenvId !== null ? statenvId : existingEnv.statenvId,
      },
    });

    return { 
      success: true, 
      message: `L'environnement ${env} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'environnement:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'environnement" 
    };
  } finally {
    revalidatePath("/list/envs");
    revalidatePath(`/list/envs/${env}`);
  }
}

