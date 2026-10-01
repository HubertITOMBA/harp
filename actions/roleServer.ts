'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { authorizeResolvedEnvironment } from '@/lib/environment-access'
import { normalizeEnvironmentName } from '@/lib/user-scopes'

/**
 * Serveurs d'un environnement désigné par son nom.
 * envsharp est résolu par env. La famille lue sur cette ligne et le périmètre
 * sont exigés avant toute lecture de harpenvserv.
 * Un refus renvoie une liste vide.
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
    select: { id: true, typenvid: true, scopeId: true },
  })

  const access = await authorizeResolvedEnvironment(environment)

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
