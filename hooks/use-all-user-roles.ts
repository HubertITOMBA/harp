"use client";

import { useEffect, useState } from "react";
import { getAllUserRoles } from "@/actions/get-all-user-roles";

/**
 * Hook pour récupérer tous les rôles d'un utilisateur (fusionné)
 * Combine le rôle principal User.role et les rôles de harproles via harpuseroles
 * 
 * @returns {string[]} Array de tous les rôles uniques de l'utilisateur
 */
export function useAllUserRoles(): string[] {
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const userRoles = await getAllUserRoles();
        setRoles(userRoles);
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles:", error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return roles;
}

/**
 * Hook pour vérifier si un utilisateur a un rôle spécifique
 * 
 * @param role - Le rôle à vérifier
 * @returns {boolean} true si l'utilisateur a ce rôle
 */
export function useHasRole(role: string): boolean {
  const roles = useAllUserRoles();
  return roles.includes(role);
}

/**
 * Hook pour vérifier si un utilisateur a au moins un des rôles spécifiés
 * 
 * @param rolesToCheck - Array de rôles à vérifier
 * @returns {boolean} true si l'utilisateur a au moins un des rôles
 */
export function useHasAnyRole(rolesToCheck: string[]): boolean {
  const roles = useAllUserRoles();
  return rolesToCheck.some(role => roles.includes(role));
}

/**
 * Hook pour vérifier si un utilisateur a tous les rôles spécifiés
 * 
 * @param rolesToCheck - Array de rôles à vérifier
 * @returns {boolean} true si l'utilisateur a tous les rôles
 */
export function useHasAllRoles(rolesToCheck: string[]): boolean {
  const roles = useAllUserRoles();
  return rolesToCheck.every(role => roles.includes(role));
}

