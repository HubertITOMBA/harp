'use server'

import { db } from '@/lib/db'

export async function getServerData(id: number) {
  // const data = await db.harpenvserv.findMany({
  //   where: {
  //     envId: id
  //   },
  //   include: {
  //     harpserve: true,
  //     psadm_typsrv: true,
  //     statutenv: true,
  //   }
  // })
  const data = await db.harpenvserv.findMany({
    where: {
      envId: id
    },
    select: {
      id: true,
      envId: true,
      serverId: true,
      typsrv: true,
      status: true,
      // envsharp: {
      //   select: {
      //     env: true
      //   }
      // },
      harpserve: {
        select: {
          srv: true,
          ip: true,
          pshome: true,
          os: true,
          psuser: true,
          domain: true
        }
      },
      // psadm_typsrv: {
      //   select: {
      //     descr: true
      //   }
      // },
      statutenv: {
        select: {
          statenv: true,
          descr: true,
          icone: true
        }
      }
    }
  })
  return data
}