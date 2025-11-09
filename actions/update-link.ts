"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateLinkSchema = z.object({
  link: z.string().min(1, "Le nom du lien est requis").max(32),
  typlink: z.string().min(1, "Le type de lien est requis").max(32),
  tab: z.string().min(1, "L'onglet est requis").max(32),
  url: z.string().min(1, "L'URL est requise").max(255),
  logo: z.string().max(50).optional().or(z.literal("")),
  descr: z.string().max(50).optional().or(z.literal("")),
  display: z.coerce.number().int().optional(),
});

export async function updateLink(
  originalLink: string,
  originalTyplink: string,
  originalTab: string,
  formData: FormData
) {
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

    const validatedData = UpdateLinkSchema.parse(rawData);

    // Vérifier si le lien existe
    const existingLink = await db.psadm_link.findFirst({
      where: {
        link: originalLink,
        typlink: originalTyplink,
        tab: originalTab,
      },
    });

    if (!existingLink) {
      return { success: false, error: "Lien non trouvé" };
    }

    // Si les clés primaires changent, vérifier qu'il n'existe pas déjà
    if (
      originalLink !== validatedData.link ||
      originalTyplink !== validatedData.typlink ||
      originalTab !== validatedData.tab
    ) {
      const duplicateLink = await db.psadm_link.findFirst({
        where: {
          link: validatedData.link,
          typlink: validatedData.typlink,
          tab: validatedData.tab,
        },
      });

      if (duplicateLink) {
        return { success: false, error: "Un lien avec ces identifiants existe déjà" };
      }
    }

    // Supprimer l'ancien enregistrement et créer le nouveau
    // (Prisma ne supporte pas directement la mise à jour d'une clé primaire composite)
    await db.psadm_link.deleteMany({
      where: {
        link: originalLink,
        typlink: originalTyplink,
        tab: originalTab,
      },
    });

    await db.psadm_link.create({
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
      message: `Le lien ${validatedData.link} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du lien:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du lien" 
    };
  } finally {
    revalidatePath("/list/links");
  }
}

