"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail, getUserByNetId } from "@/data/user";


/** Redirection valide : chemin local commençant par / (évite open redirect) */
function isValidRedirect(path: string): boolean {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
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

        // Vérifier si le compte est désactivé (mot de passe préfixé par DISABLED_)
        if (existingUser.password.startsWith("DISABLED_")) {
            return {
                error: "Votre compte est désactivé. Veuillez contacter l'administrateur pour recouvrer l'accès.",
            };
        }



   //  return { success: "Connexion effectuée avec succès !"}

   try {
        // Utiliser redirect: false pour éviter les problèmes avec les Server Actions dans Next.js 15
        // Note: signIn peut toujours lancer une erreur de redirection même avec redirect: false
        try {
            const result = await signIn("credentials", {
                netid,
                password, 
                redirect: false,
            })

            // Si signIn retourne une erreur, la gérer
            if (result && typeof result === 'object' && 'error' in result) {
                return { error: "Informations d'identification invalides !" }
            }

            // Si la connexion réussit, retourner un succès avec l'URL de redirection
            const redirectTo = callbackUrl && isValidRedirect(callbackUrl) ? callbackUrl : DEFAULT_LOGIN_REDIRECT;
            return { 
                success: true, 
                redirectTo 
            }
        } catch (signInError: any) {
            // Gérer spécifiquement les erreurs de redirection de Next.js
            // Next.js peut lancer une erreur de redirection même avec redirect: false
            if (signInError?.digest?.startsWith('NEXT_REDIRECT') || 
                signInError?.message?.includes('NEXT_REDIRECT') ||
                signInError?.name === 'RedirectError') {
                const redirectTo = callbackUrl && isValidRedirect(callbackUrl) ? callbackUrl : DEFAULT_LOGIN_REDIRECT;
                return { 
                    success: true, 
                    redirectTo 
                }
            }
            // Relancer l'erreur pour qu'elle soit gérée par le catch externe
            throw signInError;
        }

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
