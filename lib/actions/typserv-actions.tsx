"use server";

import { db } from "@/lib/db";

// Get single type service by its typsrv
export async function getTypeServById(typsrv: string) {
  return await db.psadm_typsrv.findUnique({
    where: { typsrv },
    include: {
      psadm_rolesrv: {
        include: {
          psadm_srv: {
            select: {
              srv: true,
              ip: true,
            }
          },
          psadm_env: {
            select: {
              env: true,
              descr: true,
            }
          }
        }
      }
    }
  });
}

