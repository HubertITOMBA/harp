"use client";

import { NavbarPosition } from './NavbarPosition';
import { ReactNode } from 'react';

interface ConditionalNavbarWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper client pour ajuster la position de la Navbar selon le pathname
 * La Navbar est rendue côté serveur et passée comme children
 * Ce composant ajuste seulement le positionnement CSS
 */
export function ConditionalNavbarWrapper({ children }: ConditionalNavbarWrapperProps) {
  // Utiliser NavbarPosition pour ajuster le positionnement selon le pathname
  return <NavbarPosition>{children}</NavbarPosition>;
}

