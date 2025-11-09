"use server";

import prisma from "@/lib/prisma";

// Get single role by its id
export async function getHarpRoleById(id: string | number) {
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


  