
import type { Metadata } from "next";

import Link from "next/link";
import Image from 'next/image'
import React from 'react'
import Menu from "@/components/home/Menu";
import Navbar from "@/components/home/Navbar";
import { MobileMenuButton } from "@/components/ui/mobile-menu-button";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { formatRolesForMenu } from "@/lib/user-roles";



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
           <Link href="/auth/signin" className="text-primary hover:underline">
             Se connecter
           </Link>
         </div>
       </div>
     );
   }
   
   console.log(`[Layout Protected] Session active pour l'utilisateur: ${session.user.id}`);
   
   // Récupérer tous les rôles fusionnés de l'utilisateur
   // Fusionne : User.role (rôle principal) + harproles via harpuseroles
   const allUserRolesArray = await getAllUserRoles();
   
   // Formater pour compatibilité avec le système Menu existant
   // Format attendu: "ROLE1", "ROLE2", "ROLE3"
   const roles = formatRolesForMenu(allUserRolesArray);
   
   console.log(`[Layout Protected] Rôles fusionnés (${allUserRolesArray.length}):`, allUserRolesArray);
   console.log(`[Layout Protected] Rôles formatés pour Menu:`, roles);

   // Compter les sessions actives
   // Pour l'instant, on considère qu'il y a 1 session active si l'utilisateur est connecté
   // TODO: Implémenter un vrai compteur de sessions si nécessaire
   const activeSessionCount = session ? 1 : 0;

  return (
    <div className="h-screen flex flex-col md:flex-row">
       <SessionProvider session={session}>
          {/* Sidebar - cachée sur mobile, visible avec menu hamburger */}
          <aside className="hidden md:block w-[14%] lg:w-[16%] xl:w-[14%] p-4 bg-white border-r border-gray-200">
            <Link href="/" >
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
              <h2 className="mx-2 text-xs md:text-sm font-bold text-gray-500">Human Ressources <span className="text-base md:text-lg font-bold text-harpOrange">&</span> Payroll</h2>   
            </Link>
            <Menu  DroitsUser = {roles} sessionCount={activeSessionCount} />
          </aside>
          
          {/* Menu mobile avec hamburger */}
          <div className="md:hidden">
            <MobileMenuButton>
              <Link href="/" className="block mb-4">
                <h1 className="text-4xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
                <h2 className="text-xs font-bold text-gray-500">Human Ressources <span className="text-base font-bold text-harpOrange">&</span> Payroll</h2>   
              </Link>
              <Menu  DroitsUser = {roles} sessionCount={activeSessionCount} />
            </MobileMenuButton>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 w-full md:w-[86%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col">
              <Navbar   DroitsUser = {roles}/>
               { children }
          </div>
        </SessionProvider> 
    </div>
  )
  
};
 