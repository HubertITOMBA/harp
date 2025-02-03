'use server'

import { db } from '@/lib/db'

export async function getServerData(env: string) {
  const data = await db.psadm_rolesrv.findMany({
    where: {
      env: env
    },
    include: {
      psadm_srv: true,
      psadm_typsrv: true,
    }
  })
  return data
}