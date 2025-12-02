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

         session.user.customField =  await getUserRoles(parseInt(session.user.id));
        // console.log("DANS auth.ts ==> ", {Session_CUSTOM_TOKEN_USER_ROLE : session.user.customField });

         if (token.role && session.user) {
            session.user.role = token.role;
           // session.user.role = token.role as UserRole;
           //  session.user.customField =  await getUserRoles(parseInt(token.sub));
         }

         if (token.netid && session.user) {
            session.user.netid = token.netid as string;
         }

         if (token.pkeyfile && session.user) {
            session.user.pkeyfile = token.pkeyfile as string;
         }

        return  session;
       }, 
       
       async jwt({ token, user, profile } ) {
           // console.log("LE TOKEN USER PROFILE DANS auth.ts ==> ",{token, user, profile});
            if(!token.sub)  return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;
 
            const userRoles = await getUserRoles(parseInt(token.sub));
           // console.log("LE TOKEN ROLES JWT  DANS auth.ts ==> ",{userRoles});
            token.role = userRoles;
            token.netid = existingUser.netid || null;
            token.pkeyfile = existingUser.pkeyfile || null;

            return token;   
         }    
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt"},
   ...authConfig,
});    