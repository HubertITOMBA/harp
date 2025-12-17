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

        try {
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

          return session;
        } catch (error) {
          console.error("Erreur dans le callback session:", error);
          // Retourner la session même en cas d'erreur pour éviter les erreurs 500
          return session;
        }
       }, 
       
       async jwt({ token, user, profile, trigger } ) {
           // console.log("LE TOKEN USER PROFILE DANS auth.ts ==> ",{token, user, profile});
            
            try {
              // Lors de la première connexion, user est présent
              if (user) {
                token.sub = user.id;
                token.name = user.name;
                
                // Récupérer les rôles lors de la première connexion
                try {
                  const existingUser = await getUserById(user.id);
                  if (existingUser) {
                    const userRoles = await getUserRoles(parseInt(user.id));
                    // S'assurer que userRoles n'est pas undefined
                    token.role = userRoles || "";
                    token.customField = userRoles || "";
                    token.netid = existingUser.netid || null;
                    token.pkeyfile = existingUser.pkeyfile || null;
                  }
                } catch (error) {
                  console.error("Erreur lors de la récupération des rôles utilisateur:", error);
                  // Continuer avec des valeurs par défaut
                  token.role = "";
                  token.customField = "";
                }
                return token;
              }

              // Pour les requêtes suivantes, vérifier si on doit rafraîchir les rôles
              if(!token.sub)  return token;

              // Récupérer les rôles uniquement lors du rafraîchissement explicite du token
              // Ne pas refaire la requête à chaque requête HTTP (optimisation performance)
              const shouldRefreshRoles = !token.customField || trigger === "update";
              
              if (shouldRefreshRoles) {
                try {
                  const existingUser = await getUserById(token.sub);

                  if (!existingUser) return token;
     
                  const userRoles = await getUserRoles(parseInt(token.sub));
                  // console.log("LE TOKEN ROLES JWT  DANS auth.ts ==> ",{userRoles});
                  // S'assurer que userRoles n'est pas undefined
                  token.role = userRoles || "";
                  token.customField = userRoles || ""; // Stocker aussi dans customField pour le session callback
                  token.netid = existingUser.netid || null;
                  token.pkeyfile = existingUser.pkeyfile || null;
                } catch (error) {
                  console.error("Erreur lors du rafraîchissement des rôles:", error);
                  // Conserver les valeurs existantes du token en cas d'erreur
                }
              }

              return token;
            } catch (error) {
              console.error("Erreur dans le callback jwt:", error);
              // Retourner le token même en cas d'erreur pour éviter les erreurs 500
              return token;
            }
         }    
    },
    adapter: PrismaAdapter(db),
    session: { 
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes (au lieu de 30 jours par défaut)
    },
   ...authConfig,
});    