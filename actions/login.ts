"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";


export const login = async (values: z.infer<typeof LoginSchema>,
  //  callbackUrl?: string | null,
) => {
    console.log(values);
    const validatedFields = LoginSchema.safeParse(values);
    
     if (!validatedFields.success) {
        return { error: "Informations de connexion invalides !"}
     }

     const { email, password, name } = validatedFields.data;

     const existingUser = await getUserByEmail(email);

        if (!existingUser || !existingUser.email || !existingUser.password) {
            return { error: "Email n'existe pas!" }
         }



   //  return { success: "Connexion effectuée avec succès !"}

   try {
        await signIn("credentials", {
            email,
            password, 
            redirectTo : DEFAULT_LOGIN_REDIRECT,
        })

    console.log(email, password, name, DEFAULT_LOGIN_REDIRECT);

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
            case "CredentialsSignin":
                return { error: "Informations d'identification invalides loginTS !" }
            default:
                return { error: "Quelque chose s'est mal passée !" }
            }
        }
    throw error;
}
};
