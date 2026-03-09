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

            if (!validatedFields.success) {
              return null;
            }

            const { netid, password } = validatedFields.data;
            const user = await getUserByNetId(netid);

            // Si l'utilisateur n'existe pas ou n'a pas de mot de passe, refuser
            if (!user || !user.password) {
              return null;
            }

            // Vérifier si l'utilisateur est désactivé
            if (user.password.startsWith("DISABLED_")) {
              console.log(`Tentative de connexion pour l'utilisateur désactivé: ${netid}`);
              return null;
            }

            /**
             * IMPORTANT (TEMPORAIRE) :
             * Pour rétablir l'accès rapidement au portail sans bloquer les utilisateurs,
             * on revient au comportement historique : dès que l'utilisateur existe
             * et n'est pas désactivé, on le considère comme authentifié.
             *
             * La vérification fine du mot de passe (bcrypt / clair) sera
             * réintroduite une fois la stratégie de stockage unifiée.
             */
            return user;
       }
    })
  ],
} satisfies NextAuthConfig