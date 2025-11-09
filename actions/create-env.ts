"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateEnvSchema = z.object({
  env: z.string().min(1, "Le nom de l'environnement est requis").max(32),
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

export async function createEnv(formData: FormData) {
  try {
    const rawData = {
      env: formData.get("env") as string,
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

    const validatedData = CreateEnvSchema.parse(rawData);

    // Vérifier si l'environnement existe déjà
    const existingEnv = await db.envsharp.findUnique({
      where: { env: validatedData.env },
    });

    if (existingEnv) {
      return { success: false, error: "Un environnement avec ce nom existe déjà" };
    }

    // Convertir les IDs si présents
    const typenvid = validatedData.typenvid ? parseInt(validatedData.typenvid) : null;
    const statenvId = validatedData.statenvId ? parseInt(validatedData.statenvId) : 4; // Statut par défaut

    // Créer l'environnement
    await db.envsharp.create({
      data: {
        env: validatedData.env,
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
        typenvid: typenvid,
        statenvId: statenvId,
      },
    });

    return { 
      success: true, 
      message: `L'environnement ${validatedData.env} a été créé avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'environnement:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'environnement" 
    };
  } finally {
    revalidatePath("/list/envs");
  }
}

