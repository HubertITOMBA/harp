import Link from "next/link";
import React from 'react'
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ConditionalNavbarWrapper } from "@/components/layout/ConditionalNavbarWrapper";
import Navbar from "@/components/home/Navbar";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { formatRolesForMenu } from "@/lib/user-roles";

export default async function UserLayout({
  children,
}: Readonly<{
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
  
  // Récupérer tous les rôles fusionnés de l'utilisateur
  const allUserRolesArray = await getAllUserRoles();
  const roles = formatRolesForMenu(allUserRolesArray);
  
  return (
    <div className="h-screen flex flex-col md:flex-row">
      <SessionProvider session={session}>
        {/* Sidebar spécifique au profil - cachée sur mobile, visible avec menu hamburger */}
        <aside className="hidden md:block w-[70px] lg:w-[70px] xl:w-[16%] p-2 md:p-2 lg:p-2 xl:p-4 bg-white border-r border-gray-200">
          <Link href="/home" className="flex flex-col items-center xl:items-start">
            <h1 className="text-2xl md:text-3xl lg:text-3xl xl:text-6xl 2xl:text-8xl font-bold text-harpOrange">h<span className="text-gray-400">a</span>rp</h1>
            <h2 className="mx-1 md:mx-2 text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 hidden xl:block">Human Ressources <span className="text-sm md:text-base lg:text-lg font-bold text-harpOrange">&</span> Payroll</h2>   
          </Link>
          <ProfileSidebar />
        </aside>
        
        {/* Contenu principal - avec navbar fixe en haut */}
        <div className="flex-1 w-full md:w-[calc(100%-70px)] lg:w-[calc(100%-70px)] xl:w-[84%] bg-[#F7F8FA] flex flex-col relative">
          {/* Navbar fixe en haut - positionnée pour tenir compte de la sidebar */}
          <ConditionalNavbarWrapper>
            <Navbar DroitsUser={roles} />
          </ConditionalNavbarWrapper>
          {/* Espace pour la navbar fixe (hauteur approximative de la navbar avec titre TMA HARP + barre orange + contenu) */}
          {/* Mobile: ~140px (titre + barre + contenu), Desktop: ~130px */}
          <div className="h-[140px] md:h-[130px] flex-shrink-0" />
          {/* Contenu qui scroll sous la navbar */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </SessionProvider>
    </div>
  );
}

