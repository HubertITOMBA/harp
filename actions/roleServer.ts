'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { loadEnvironmentScopeFilter } from '@/lib/load-environment-scope-filter'
import {
  decideEnvironmentServerAccess,
  normalizeEnvironmentName,
} from '@/lib/user-scopes'

/**
 * Serveurs d'un environnement désigné par son nom.
 * La session est obligatoire. envsharp est résolu par env, puis le scope
 * est jugé avant toute lecture de harpenvserv.
 * Un refus ne décrit pas le périmètre.
 *
 * @param envName - Nom envsharp.env saisi par l'appelant
 * @returns Les serveurs autorisés, ou une liste vide
 */
export async function getServerData(envName: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const env = normalizeEnvironmentName(envName)
  if (env == null) {
    return []
  }

  const environment = await db.envsharp.findUnique({
    where: { env },
    select: { id: true, scopeId: true },
  })

  const scopeFilter = await loadEnvironmentScopeFilter()
  const access = decideEnvironmentServerAccess({
    authenticated: true,
    environment,
    scopeFilter,
  })

  if (access !== 200 || environment == null) {
    return []
  }

  const data = await db.harpenvserv.findMany({
    where: {
      envId: environment.id
    },
    select: {
      id: true,
      envId: true,
      serverId: true,
      typsrv: true,
      status: true,
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
