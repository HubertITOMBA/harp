"use server";

import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail, getUserByNetId } from "@/data/user";
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"



export const register = async (values: z.infer<typeof RegisterSchema>) => {
    // console.log(values);
    const validatedFields = RegisterSchema.safeParse(values);
    
    if (!validatedFields.success) {
      return { error: "Informations de connexion invalides !"}
  }
    

    const { netid, email, password} = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // const existingUser = await getUserByNetId(netid);
    const existingUser = await getUserByNetId(netid);

    if (existingUser) {
      return { error: " Le netID est déjà utilisé !"}
    }

    try {
      await db.user.create({
        data: {
            netid,
            email,
            password: hashedPassword,
            
        }
       });
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("not allowed to connect")) {
          return { 
            error: "❌ Erreur de connexion à la base de données : L'hôte n'est pas autorisé. Contactez l'administrateur pour autoriser l'accès à la base de données." 
          };
        }
      }
      
      throw error;
    }
   
   return { success: "Compte créé avec succès !"}

   
};
