"use server"

import { revalidatePath } from "next/cache";

/**
 * Cette fonction est désactivée car la table harpuseroles n'a pas de champ rolep.
 * La fonctionnalité de "rôle principal" n'existe plus dans la nouvelle structure.
 * 
 * @deprecated Cette fonctionnalité n'est plus disponible avec les nouvelles tables HARP
 */
export async function updateUserRoles(netid: string, role: string, formData: FormData) {
  // La table harpuseroles n'a pas de champ rolep, cette fonctionnalité n'est plus disponible
  return { 
    success: false, 
    error: "La modification du rôle principal n'est plus disponible. La table harpuseroles ne contient pas ce champ." 
  };
}

