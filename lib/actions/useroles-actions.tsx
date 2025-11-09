"use server";

import { db } from "@/lib/db";

// Get single user role by netid and role
export async function getUserRolesById(netid: string, role: string) {
  return await db.psadm_roleuser.findFirst({
    where: {
      netid,
      role,
    },
    include: {
      psadm_user: {
        select: {
          netid: true,
          nom: true,
          prenom: true,
          email: true,
        }
      },
      psadm_role: {
        select: {
          role: true,
          descr: true,
        }
      }
    }
  });
}

