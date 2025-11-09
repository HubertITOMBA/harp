"use server";

import { db } from "@/lib/db";

// Get single servrole by srv, env, and typsrv
export async function getServRoleById(srv: string, env: string, typsrv: string) {
  return await db.psadm_rolesrv.findFirst({
    where: {
      srv,
      env,
      typsrv,
    },
    include: {
      psadm_srv: {
        select: {
          srv: true,
          ip: true,
          pshome: true,
          os: true,
          psuser: true,
          domain: true,
        }
      },
      psadm_env: {
        select: {
          env: true,
          descr: true,
          site: true,
        }
      },
      psadm_typsrv: {
        select: {
          typsrv: true,
          descr: true,
        }
      }
    }
  });
}

