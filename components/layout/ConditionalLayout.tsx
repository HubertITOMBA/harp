"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ConditionalLayoutProps {
  children: ReactNode;
  showMainMenu: boolean;
  mainMenuContent: ReactNode;
  profileMenuContent?: ReactNode;
}

/**
 * Composant qui conditionne l'affichage du menu latéral selon le pathname
 * Si on est sur /user/profile, le menu principal n'est pas affiché
 * et le layout enfant (user/layout.tsx) gère l'affichage de son propre menu
 */
export function ConditionalLayout({ 
  children, 
  showMainMenu, 
  mainMenuContent,
  profileMenuContent
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isUserProfile = pathname?.includes('/user/profile') || false;

  // Si on est sur /user/profile, ne pas afficher le menu principal ni la navbar
  // Le layout enfant (user/layout.tsx) s'occupera d'afficher son propre menu
  if (isUserProfile) {
    return <>{children}</>;
  }

  // Sinon, afficher le menu principal et la navbar dans le contenu principal
  return (
    <>
      {showMainMenu && mainMenuContent}
      {children}
    </>
  );
}

