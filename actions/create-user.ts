"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  netid: z.string().min(1, "Le Net ID est requis").max(32),
  nom: z.string().max(32).optional(),
  prenom: z.string().max(32).optional(),
  email: z.string().email("Email invalide").max(100).optional().or(z.literal("")),
  unxid: z.string().max(32).optional().or(z.literal("")),
  oprid: z.string().max(32).optional().or(z.literal("")),
  pkeyfile: z.string().max(50).optional().or(z.literal("")),
  defpage: z.string().max(32).optional().or(z.literal("")),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  expunx: z.string().optional(),
  expora: z.string().optional(),
});

export async function createUser(formData: FormData) {
  try {
    const rawData = {
      netid: formData.get("netid") as string,
      nom: formData.get("nom") as string || undefined,
      prenom: formData.get("prenom") as string || undefined,
      email: formData.get("email") as string || undefined,
      unxid: formData.get("unxid") as string || undefined,
      oprid: formData.get("oprid") as string || undefined,
      pkeyfile: formData.get("pkeyfile") as string || undefined,
      defpage: formData.get("defpage") as string || undefined,
      password: formData.get("password") as string,
      expunx: formData.get("expunx") as string || undefined,
      expora: formData.get("expora") as string || undefined,
    };

    const validatedData = CreateUserSchema.parse(rawData);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.psadm_user.findUnique({
      where: { netid: validatedData.netid },
    });

    if (existingUser) {
      return { success: false, error: "Un utilisateur avec ce Net ID existe déjà" };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Convertir les dates si présentes
    const expunx = validatedData.expunx ? new Date(validatedData.expunx) : null;
    const expora = validatedData.expora ? new Date(validatedData.expora) : null;

    // Créer l'utilisateur
    await db.psadm_user.create({
      data: {
        netid: validatedData.netid,
        nom: validatedData.nom || null,
        prenom: validatedData.prenom || null,
        email: validatedData.email || null,
        unxid: validatedData.unxid || null,
        oprid: validatedData.oprid || null,
        pkeyfile: validatedData.pkeyfile || null,
        defpage: validatedData.defpage || null,
        mdp: hashedPassword,
        expunx: expunx,
        expora: expora,
      },
    });

    return { 
      success: true, 
      message: `L'utilisateur ${validatedData.netid} a été créé avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'utilisateur" 
    };
  } finally {
    revalidatePath("/list/users");
  }
}

