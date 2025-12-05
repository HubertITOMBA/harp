import Link from "next/link";
import React from 'react'
import { MobileMenuButton } from "@/components/ui/mobile-menu-button";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { formatRolesForMenu, hasAnyRole, parseRolesFromString } from "@/lib/user-roles";

import Navbar from "@/components/home/Navbar";
import MenuDash from "@/components/harp/MenuDash";



export default async function HarpLayout ( {
   modal,
   children,
}: Readonly<{
  modal: React.ReactNode;
  children: React.ReactNode;
}>) {

    const session = await auth();
    
    // Vérifier que l'utilisateur est connecté
    if (!session?.user?.id) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Session expirée</h1>
            <p className="text-muted-foreground mb-4">Veuillez vous reconnecter</p>
            <Link href="/auth/signin" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      );
    }
    
    // Récupérer les rôles depuis la session (optimisé pour les performances)
    // Les rôles sont déjà dans session.user.customField après optimisation de auth.ts
    let allUserRolesArray: string[] = [];
    
    if (session.user.customField) {
      // Parser les rôles depuis le format "ROLE1", "ROLE2", "ROLE3"
      allUserRolesArray = parseRolesFromString(session.user.customField);
    }
    
    // Fallback : si pas de rôles dans la session, utiliser getAllUserRoles
    // (mais cela ne devrait plus arriver après l'optimisation)
    if (allUserRolesArray.length === 0) {
      allUserRolesArray = await getAllUserRoles();
    }
    
    // Vérifier que l'utilisateur a au moins un des rôles requis pour accéder au dashboard
    // Rôles requis : PSADMIN ou PORTAL_ADMIN
    const requiredRoles = ["PSADMIN", "PORTAL_ADMIN"];
    const hasRequiredRole = hasAnyRole(allUserRolesArray, requiredRoles);
    
     if (!hasRequiredRole) {
      // Rediriger vers la page d'accueil ou afficher un message d'accès refusé
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Accès refusé</h1>
            <p className="text-muted-foreground mb-4">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Rôles requis : PSADMIN ou PORTAL_ADMIN
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Vos rôles actuels : {allUserRolesArray.length > 0 ? allUserRolesArray.join(", ") : "Aucun"}
            </p>
            <Link href="/home" className="text-primary hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      );
    } // ## if (!hasRequiredRole) {
    
    // Formater pour compatibilité avec le système Menu existant
    // Format attendu: "ROLE1", "ROLE2", "ROLE3"
    const roles = formatRolesForMenu(allUserRolesArray);

    // Fonction pour compter les sessions actives
  //   const getActiveSessionCount = async () => {
  //   try {
  //     const response = await fetch('/api/sessions/count');
  //     const data = await response.json();
  //     return data.count;
  //   } catch (error) {
  //     console.error('Erreur lors du comptage des sessions:', error);
  //     return 0;
  //   }
  // };


  // const activeSessionCount = await getActiveSessionCount();
  const activeSessionCount = 1;

  return (
    <div className="flex flex-col md:flex-row h-screen">
       <SessionProvider session={session}>
          {/* Sidebar - cachée sur mobile, visible avec menu hamburger */}
          <aside className="hidden md:block w-[70px] lg:w-[70px] xl:w-[16%] p-2 md:p-2 lg:p-2 xl:p-4 bg-white border-r border-gray-200">
            <Link href="/" className="flex flex-col items-center xl:items-start">
              <h1 className="text-2xl md:text-3xl lg:text-3xl xl:text-6xl 2xl:text-8xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
              <h2 className="mx-1 md:mx-2 text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 hidden xl:block">Human Ressources <span className="text-sm md:text-base lg:text-lg font-bold text-harpOrange">&</span> Payroll</h2>   
            </Link>
            <MenuDash   DroitsUser = {roles} sessionCount={activeSessionCount} />
          </aside>
          
          {/* Menu mobile avec hamburger */}
          <div className="md:hidden">
            <MobileMenuButton>
              <Link href="/" className="block mb-4">
                <h1 className="text-4xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
                <h2 className="hidden text-xs font-bold text-gray-500">Human Ressources <span className="text-base font-bold text-harpOrange">&</span> Payroll</h2>   
              </Link>
              <MenuDash   DroitsUser = {roles} sessionCount={activeSessionCount} />
            </MobileMenuButton>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 w-full md:w-[calc(100%-70px)] lg:w-[calc(100%-70px)] xl:w-[84%] overflow-auto flex flex-col">
            <Navbar   DroitsUser = {roles}/>
            { modal } 
            { children }
          </div>
 
        </SessionProvider>
    </div>
  );
  
};
 