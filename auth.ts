import NextAuth, { DefaultSession } from "next-auth";
import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getUserById } from "./data/user";
import { getUserRoles } from "./actions/menurigth";



export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    // Configuration pour la production (HTTP ou HTTPS)
    // Activer les cookies sécurisés si on utilise HTTPS
    useSecureCookies: process.env.AUTH_URL?.startsWith('https://') ?? true,
    trustHost: true, // Requis pour NextAuth v5 en production
    callbacks: { 
      // Pas important pour Harp 
      //  async signIn({ user }) {
      //     const existingUser = await getUserById(user.id);

      //     if (!existingUser || !existingUser.emailVerified) {
      //       return false;
      //     }
      //    return true; 
      //  },

       async session ({ token, session}) {
       // console.log("ASYNC TOKEN SESSION DANS auth.ts ==> ", {LOG_Session_TOKEN: token, session });

        if (token.sub && session.user) {
            session.user.id = token.sub;
            session.user.name = token.name;
                       
         }

         // Utiliser les rôles du token au lieu de refaire une requête à chaque fois
         // Cela améliore considérablement les performances
         if (token.customField && session.user) {
            session.user.customField = token.customField as string;
         } else if (token.role && session.user) {
            // Fallback : utiliser token.role si customField n'est pas disponible
            session.user.customField = token.role as string;
         }

         if (token.role && session.user) {
            session.user.role = token.role;
         }

         if (token.netid && session.user) {
            session.user.netid = token.netid as string;
         }

         if (token.pkeyfile && session.user) {
            session.user.pkeyfile = token.pkeyfile as string;
         }

        return  session;
       }, 
       
       async jwt({ token, user, profile, trigger } ) {
           // console.log("LE TOKEN USER PROFILE DANS auth.ts ==> ",{token, user, profile});
            
            // Lors de la première connexion, user est présent
            if (user) {
              token.sub = user.id;
              token.name = user.name;
              
              // Récupérer les rôles lors de la première connexion
              const existingUser = await getUserById(user.id);
              if (existingUser) {
                const userRoles = await getUserRoles(parseInt(user.id));
                token.role = userRoles;
                token.customField = userRoles;
                token.netid = existingUser.netid || null;
                token.pkeyfile = existingUser.pkeyfile || null;
              }
              return token;
            }

            // Pour les requêtes suivantes, vérifier si on doit rafraîchir les rôles
            if(!token.sub)  return token;

            // Récupérer les rôles uniquement lors du rafraîchissement explicite du token
            // Ne pas refaire la requête à chaque requête HTTP (optimisation performance)
            const shouldRefreshRoles = !token.customField || trigger === "update";
            
            if (shouldRefreshRoles) {
              const existingUser = await getUserById(token.sub);

              if (!existingUser) return token;
   
              const userRoles = await getUserRoles(parseInt(token.sub));
             // console.log("LE TOKEN ROLES JWT  DANS auth.ts ==> ",{userRoles});
              token.role = userRoles;
              token.customField = userRoles; // Stocker aussi dans customField pour le session callback
              token.netid = existingUser.netid || null;
              token.pkeyfile = existingUser.pkeyfile || null;
            }

            return token;   
         }    
    },
    adapter: PrismaAdapter(db),
    session: { 
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes (au lieu de 30 jours par défaut)
    },
   ...authConfig,
});    