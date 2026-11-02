"use server";

import prisma from "@/lib/prisma";
import { requirePortalAdmin } from "@/lib/require-portal-admin";

/**
 * Réserve la lecture d'un rôle à PORTAL_ADMIN.
 *
 * @returns false si la session n'est pas administrateur
 */
async function canReadAdminRole(): Promise<boolean> {
  const admin = await requirePortalAdmin();
  return admin.ok;
}

// Get single role by its id
export async function getHarpRoleById(id: string | number) {
  if (!(await canReadAdminRole())) {
    return null;
  }

  const roleId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isNaN(roleId)) {
    return null;
  }
  
  return await prisma.harproles.findUnique({
    where: { id: roleId },
  });
}

// Get single role by its id with users
export async function getHarpRoleByIdWithUsers(id: string | number) {
  if (!(await canReadAdminRole())) {
    return null;
  }

  const roleId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isNaN(roleId)) {
    return null;
  }
  
  return await prisma.harproles.findUnique({
    where: { id: roleId },
    include: {
      harpuseroles: {
        include: {
          user: {
            select: {
              id: true,
              netid: true,
              nom: true,
              prenom: true,
              email: true,
            }
          }
        }
      }
    }
  });
}


  