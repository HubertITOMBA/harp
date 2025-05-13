"use server"

import * as z from "zod";
import  prisma from "@/lib/prisma";
import { UserSchema } from "@/schemas";
import { getUserByEmail, getUserByNetId } from "@/data/user";
import { auth } from "@/auth";




// Update the user profile
export async function updateProfile(user: { name: string; email: string }) {
    try {
      const session = await auth();
  
      const currentUser = await prisma.user.findFirst({
        where: {
          id: session?.user?.id,
        },
      });
  
      if (!currentUser) throw new Error("Utilisateur non trouvé !");
  
      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          name: user.name,
        },
      });
  
      return {
        success: true,
        message: "Mise à jour de l'utilisateur réussie",
      };
    } catch (error) {
      return { success: false, message: "Erreur lors e laa mise à jour de l'utilisateur !" };
    }
  }
  