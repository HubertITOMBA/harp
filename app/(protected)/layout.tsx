
import Link from "next/link";
import React from 'react'
import Menu from "@/components/home/Menu";
import Navbar from "@/components/home/Navbar";
import { MobileMenuButton } from "@/components/ui/mobile-menu-button";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { formatRolesForMenu } from "@/lib/user-roles";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { ConditionalNavbarWrapper } from "@/components/layout/ConditionalNavbarWrapper";



export default async function HarpLayout ( {
   children,
}: Readonly<{
  children: React.ReactNode;
}>) {

   const session = await auth();
   
   // Vérifier que l'utilisateur est connecté
   if (!session?.user?.id) {
     // Rediriger vers la page de connexion si pas de session
     // ou afficher un message d'erreur
     return (
       <div className="h-screen flex items-center justify-center">
         <div className="text-center">
           <h1 className="text-2xl font-bold mb-4">Session expirée</h1>
           <p className="text-muted-foreground mb-4">Veuillez vous reconnecter</p>
           <Link href="/login" className="text-primary hover:underline">
             Se connecter
           </Link>
         </div>
       </div>
     );
   }
   
   // console.log(`[Layout Protected] Session active pour l'utilisateur: ${session.user.id}`);
   
   // Récupérer tous les rôles fusionnés de l'utilisateur
   // Fusionne : User.role (rôle principal) + harproles via harpuseroles
   let allUserRolesArray: string[] = [];
   try {
     allUserRolesArray = await getAllUserRoles();
   } catch (error) {
     console.error("Erreur lors de la récupération des rôles dans le layout:", error);
     // Continuer avec un tableau vide pour éviter les erreurs 500
     allUserRolesArray = [];
   }
   
   // Formater pour compatibilité avec le système Menu existant
   // Format attendu: "ROLE1", "ROLE2", "ROLE3"
   let roles = "";
   try {
     roles = formatRolesForMenu(allUserRolesArray);
   } catch (error) {
     console.error("Erreur lors du formatage des rôles dans le layout:", error);
     // Continuer avec une chaîne vide pour éviter les erreurs 500
     roles = "";
   }
   
   //  console.log(`[Layout Protected] Rôles fusionnés (${allUserRolesArray.length}):`, allUserRolesArray);
   // console.log(`[Layout Protected] Rôles formatés pour Menu:`, roles);

  // Compter les sessions actives
  // Pour l'instant, on considère qu'il y a 1 session active si l'utilisateur est connecté
  // TODO: Implémenter un vrai compteur de sessions si nécessaire
  const activeSessionCount = session ? 1 : 0;

  const mainMenuSidebar = (
    <aside className="hidden md:block w-[70px] lg:w-[70px] xl:w-[16%] p-2 md:p-2 lg:p-2 xl:p-4 bg-white border-r border-gray-200">
      <Link href="/home" className="flex flex-col items-center xl:items-start">
        <h1 className="text-2xl md:text-3xl lg:text-3xl xl:text-6xl 2xl:text-8xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
        <h2 className="mx-1 md:mx-2 text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 hidden xl:block">Human Ressources <span className="text-sm md:text-base lg:text-lg font-bold text-harpOrange">&</span> Payroll</h2>   
      </Link>
      <Menu DroitsUser={roles} sessionCount={activeSessionCount} />
    </aside>
  );

  const mainMenuMobile = (
    <div className="md:hidden">
      <MobileMenuButton>
        <Link href="/home" className="block mb-4">
          <h1 className="text-4xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
          <h2 className="hidden text-xs font-bold text-gray-500">Human Ressources <span className="text-base font-bold text-harpOrange">&</span> Payroll</h2>   
        </Link>
        <Menu DroitsUser={roles} sessionCount={activeSessionCount} />
      </MobileMenuButton>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <SessionProvider session={session}>
        <ConditionalLayout
          showMainMenu={true}
          mainMenuContent={
            <>
              {mainMenuSidebar}
              {mainMenuMobile}
            </>
          }
          profileMenuContent={null}
        >
          {/* Contenu principal avec navbar conditionnelle */}
          <div className="flex-1 w-full md:w-[calc(100%-70px)] lg:w-[calc(100%-70px)] xl:w-[84%] bg-[#F7F8FA] overflow-auto flex flex-col relative">
            <ConditionalNavbarWrapper>
              <Navbar DroitsUser={roles} />
            </ConditionalNavbarWrapper>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </ConditionalLayout>
      </SessionProvider>
    </div>
  )
  
};
 