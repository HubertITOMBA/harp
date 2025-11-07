import NextAuth from "next-auth"
import authConfig from '@/auth.config';
import { 
    DEFAULT_LOGIN_REDIRECT,
    apiAuthPrefix,
    authRoutes,
    publicRoutes,
  } from "@/routes";




const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    console.log("ROUTE dans middleware.ts: ", req.nextUrl.pathname);
    console.log("IL EST CONNECTE  dans middleware.ts: ", isLoggedIn);

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isApiRoute = nextUrl.pathname.startsWith("/api/");
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    // Laisser passer toutes les routes API (sauf celles d'auth qui sont gérées par NextAuth)
    if (isApiRoute && !isApiAuthRoute) {
        return null;
    }

    if (isApiAuthRoute) {
        return null;
      }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/", nextUrl));
    }
  
   return null;

})
// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
    //  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
    // matcher: ["/login", "/register"],
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
    
    }