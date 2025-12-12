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
        if (error instanceof AuthError) {
            switch (error.type) {
            case "CredentialsSignin":
                return { error: "Informations d'identification invalides voir login.ts !" }
            default:
                return { error: "Quelque chose s'est mal passée !" }
            }
        }
    throw error;
}
};
