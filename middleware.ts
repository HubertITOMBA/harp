import NextAuth from "next-auth"
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server";
import authConfig from '@/auth.config';
import { 
    DEFAULT_LOGIN_REDIRECT,
    apiAuthPrefix,
    authRoutes,
    publicRoutes,
  } from "@/routes";
import { isMigrationInProgress } from "@/lib/init-full-migration";

// Configuration pour la production (HTTP uniquement)
const useSecureCookies = process.env.AUTH_URL?.startsWith('https://') ?? false;
const middlewareAuthConfig = {
  ...authConfig,
  useSecureCookies,
  trustHost: true,
};

const { auth } = NextAuth(middlewareAuthConfig);

/** Vérifie la session : req.auth (auth wrapper) ou getToken (fallback pour Edge/HTTP). */
async function isAuthenticated(req: { auth: unknown; nextUrl: { protocol: string }; cookies: { get: (n: string) => { value: string } | undefined } }) {
  if (req.auth) return true;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const token = await getToken({
    req: req as Parameters<typeof getToken>[0]["req"],
    secret,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  return !!token;
}

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = await isAuthenticated(req);

  //  console.log("ROUTE dans middleware.ts: ", req.nextUrl.pathname);
 //   console.log("IL EST CONNECTE  dans middleware.ts: ", isLoggedIn);

    // Redirections canoniques (évitent 404 sur /profile et /harp/envs)
    if (nextUrl.pathname === "/profile") {
        return NextResponse.redirect(new URL("/user/profile", nextUrl));
    }
    if (nextUrl.pathname === "/harp/envs" || nextUrl.pathname === "/harp/envs/") {
        return NextResponse.redirect(new URL("/list/envs", nextUrl));
    }
    // Menu DB peut avoir un lien /list/statenv ; la route réelle est /list/tpstatus
    if (nextUrl.pathname === "/list/statenv" || nextUrl.pathname === "/list/statenv/") {
        return NextResponse.redirect(new URL("/list/tpstatus", nextUrl));
    }

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isApiRoute = nextUrl.pathname.startsWith("/api/");
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);
    const isInitRoute = nextUrl.pathname === "/init";

    // Si la migration est en cours, rediriger toutes les routes (sauf /init et les API) vers /init
    if (isMigrationInProgress() && !isInitRoute && !isApiRoute && !isApiAuthRoute) {
        return Response.redirect(new URL("/init", nextUrl));
    }

    // NOTE: La synchronisation des utilisateurs ne peut pas être faite dans le middleware
    // car le middleware s'exécute sur Edge runtime où Prisma Client ne fonctionne pas.
    // La synchronisation se fait via :
    // - La route API /api/migrate-users (appelable manuellement)
    // - Le composant MigrationInit dans les layouts serveur
    // - La page /init pour la migration complète

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

    // Non connecté sur une route protégée : rediriger vers /login avec callbackUrl
    // pour que l'utilisateur revienne sur la page demandée après login (ex. /settings).
    if (!isLoggedIn && !isPublicRoute) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
        return Response.redirect(loginUrl);
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