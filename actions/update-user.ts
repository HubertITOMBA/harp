"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateUserSchema = z.object({
  netid: z.string().min(1, "Le Net ID est requis"),
  nom: z.string().max(32).optional(),
  prenom: z.string().max(32).optional(),
  email: z.string().email("Email invalide").max(100).optional().or(z.literal("")),
  unxid: z.string().max(32).optional().or(z.literal("")),
  oprid: z.string().max(32).optional().or(z.literal("")),
  pkeyfile: z.string().max(50).optional().or(z.literal("")),
  defpage: z.string().max(32).optional().or(z.literal("")),
  expunx: z.string().optional(),
  expora: z.string().optional(),
});

export async function updateUser(netid: string, formData: FormData) {
  try {
    const rawData = {
      nom: formData.get("nom") as string || undefined,
      prenom: formData.get("prenom") as string || undefined,
      email: formData.get("email") as string || undefined,
      unxid: formData.get("unxid") as string || undefined,
      oprid: formData.get("oprid") as string || undefined,
      pkeyfile: formData.get("pkeyfile") as string || undefined,
      defpage: formData.get("defpage") as string || undefined,
      expunx: formData.get("expunx") as string || undefined,
      expora: formData.get("expora") as string || undefined,
    };

    const validatedData = UpdateUserSchema.parse({ netid, ...rawData });

    // Vérifier si l'utilisateur existe
    const existingUser = await db.psadm_user.findUnique({
      where: { netid },
    });

    if (!existingUser) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Convertir les dates si présentes
    const expunx = validatedData.expunx ? new Date(validatedData.expunx) : null;
    const expora = validatedData.expora ? new Date(validatedData.expora) : null;

    // Mettre à jour l'utilisateur
    await db.psadm_user.update({
      where: { netid },
      data: {
        nom: validatedData.nom || null,
        prenom: validatedData.prenom || null,
        email: validatedData.email || null,
        unxid: validatedData.unxid || null,
        oprid: validatedData.oprid || null,
        pkeyfile: validatedData.pkeyfile || null,
        defpage: validatedData.defpage || null,
        expunx: expunx,
        expora: expora,
      },
    });

    return { 
      success: true, 
      message: `L'utilisateur ${netid} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'utilisateur" 
    };
  } finally {
    revalidatePath("/list/users");
    revalidatePath(`/list/users/${netid}`);
  }
}

