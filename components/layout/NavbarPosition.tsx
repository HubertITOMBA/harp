"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavbarPositionProps {
  children: ReactNode;
}

/**
 * Composant client qui ajuste la position de la navbar selon le pathname
 * Sur /user/profile, la navbar est positionnée en fixe
 */
export function NavbarPosition({ children }: NavbarPositionProps) {
  const pathname = usePathname();
  const isUserProfile = pathname?.includes('/user/profile') || false;

  if (isUserProfile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 md:left-[70px] lg:left-[70px] xl:left-[16%]">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

