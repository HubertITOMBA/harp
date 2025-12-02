"use server"

import * as z from "zod";
import  prisma from "@/lib/prisma";
import { UserSchema, UpdateProfileSchema } from "@/schemas";
import { getUserByEmail, getUserByNetId } from "@/data/user";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Met à jour le profil de l'utilisateur connecté
 * 
 * @param user - Les données à mettre à jour (name, pkeyfile)
 * @returns Un objet avec success (boolean) et message (string)
 */
export async function updateProfile(user: { name?: string; pkeyfile?: string }) {
    try {
      const session = await auth();
  
      if (!session?.user?.id) {
        return { success: false, message: "Utilisateur non authentifié" };
      }

      const validatedData = UpdateProfileSchema.parse(user);
  
      const currentUser = await prisma.user.findFirst({
        where: {
          id: session.user.id,
        },
      });
  
      if (!currentUser) {
        return { success: false, message: "Utilisateur non trouvé !" };
      }
  
      // Préparer les données à mettre à jour
      const updateData: { name?: string; pkeyfile?: string | null } = {};
      
      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name;
      }
      
      if (validatedData.pkeyfile !== undefined) {
        updateData.pkeyfile = validatedData.pkeyfile === "" ? null : validatedData.pkeyfile;
      }
  
      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: updateData,
      });
  
      return {
        success: true,
        message: "Profil mis à jour avec succès",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, message: error.errors[0].message };
      }
      console.error("Erreur lors de la mise à jour du profil:", error);
      return { success: false, message: "Erreur lors de la mise à jour du profil !" };
    } finally {
      revalidatePath("/user/profile");
      revalidatePath("/harp/user/profile");
    }
  }
  