"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateLinkSchema = z.object({
  link: z.string().min(1, "Le nom du lien est requis").max(32),
  typlink: z.string().min(1, "Le type de lien est requis").max(32),
  tab: z.string().min(1, "L'onglet est requis").max(32),
  url: z.string().min(1, "L'URL est requise").max(255),
  logo: z.string().max(50).optional().or(z.literal("")),
  descr: z.string().max(50).optional().or(z.literal("")),
  display: z.coerce.number().int().optional(),
});

export async function createLink(formData: FormData) {
  try {
    const rawData = {
      link: formData.get("link") as string,
      typlink: formData.get("typlink") as string,
      tab: formData.get("tab") as string,
      url: formData.get("url") as string,
      logo: formData.get("logo") as string || undefined,
      descr: formData.get("descr") as string || undefined,
      display: formData.get("display") || 0,
    };

    const validatedData = CreateLinkSchema.parse(rawData);

    // Vérifier si le lien existe déjà (clé primaire composite)
    const existingLink = await db.psadm_link.findFirst({
      where: {
        link: validatedData.link,
        typlink: validatedData.typlink,
        tab: validatedData.tab,
      },
    });

    if (existingLink) {
      return { success: false, error: "Un lien avec ces identifiants existe déjà" };
    }

    const newLink = await db.psadm_link.create({
      data: {
        link: validatedData.link,
        typlink: validatedData.typlink,
        tab: validatedData.tab,
        url: validatedData.url,
        logo: validatedData.logo || "",
        descr: validatedData.descr || "",
        display: validatedData.display || 0,
      },
    });

    return { 
      success: true, 
      message: `Le lien ${validatedData.link} a été créé avec succès`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création du lien:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création du lien" 
    };
  } finally {
    revalidatePath("/list/links");
  }
}

