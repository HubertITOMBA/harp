import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth"
// import CredentialsProvider from "next-auth/providers/credentials" 
import Credentials from "next-auth/providers/credentials" 

import { LoginSchema } from "@/schemas";
import { getUserByEmail, getUserByNetId } from "@/data/user";

export default {
  providers: [
       //CredentialsProvider({
       Credentials({
        async authorize(credentials) {
            const validatedFields = LoginSchema.safeParse(credentials);

            if (validatedFields.success) {
                const { netid, password } = validatedFields.data;
                const user = await getUserByNetId(netid);
               
               // const user = await getUserByEmail(email);

                console.log( "USER CONNECTE :", {user});
                
                    if (!user || !user.password) return null;

                    // Vérifier si l'utilisateur est désactivé
                    if (user.password.startsWith('DISABLED_')) {
                        console.log(`Tentative de connexion pour l'utilisateur désactivé: ${netid}`);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare( password, user.password,);

                    if (passwordsMatch) return user;  

                return user;  
            }
            return null;
       }
    })
  ],
} satisfies NextAuthConfig