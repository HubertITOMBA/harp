import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getUserById } from "./data/user";



export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    callbacks: { 
       async session ({ token, session}) {
        console.log({LOG_Session_TOKEN: token, session });

        if (token.sub && session.user) {
            session.user.id = token.sub;
            session.user.name = token.name;
         }

         console.log({Session_CUSTOMTOKEN_USER_ID: session.user.id });

         if (token.role && session.user) {
            session.user.role = token.role;
         }

        return session;
       }, 
       
       async jwt({ token, user, profile } ) {
            console.log("LE TOKEN USER PROFILE",{token, user, profile});
            if(!token.sub)  return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;


            token.role = existingUser.role;

            return token;   
         }    
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt"},
   ...authConfig,
});    