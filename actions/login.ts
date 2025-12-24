"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail, getUserByNetId } from "@/data/user";


export const login = async (values: z.infer<typeof LoginSchema>,
  //  callbackUrl?: string | null,
) => {
  
    const validatedFields = LoginSchema.safeParse(values);
    
     if (!validatedFields.success) {
        return { error: "Informations de connexion invalides !"}
     }

     const {netid, password  } = validatedFields.data;

     const existingUser = await getUserByNetId(netid);

    // console.log("existingUser DANS login.ts ==>", existingUser);
     

        if (!existingUser || 
            !existingUser.netid 
            || !existingUser.password
        ) {
            return { error: "Le netid saisi n'existe pas !" }
         }



   //  return { success: "Connexion effectuée avec succès !"}

   try {
        await signIn("credentials", {
            netid,
            password, 
            redirectTo : DEFAULT_LOGIN_REDIRECT,
        })

  //  console.log("DANS login.ts ==>", password, netid, DEFAULT_LOGIN_REDIRECT);

    } catch (error) {
        // Logger l'erreur pour le débogage en production
        console.error("Erreur lors de la connexion:", error);
        
        if (error instanceof AuthError) {
            switch (error.type) {
            case "CredentialsSignin":
                return { error: "Informations d'identification invalides !" }
            default:
                return { error: "Quelque chose s'est mal passée !" }
            }
        }
        
        // Gérer toutes les autres erreurs (erreurs de base de données, erreurs réseau, etc.)
        // Ne jamais relancer l'erreur pour éviter les erreurs 500
        if (error instanceof Error) {
            console.error("Erreur détaillée:", error.message, error.stack);
            return { error: "Une erreur est survenue lors de la connexion. Veuillez réessayer." }
        }
        
        return { error: "Quelque chose s'est mal passée !" }
    }
};
