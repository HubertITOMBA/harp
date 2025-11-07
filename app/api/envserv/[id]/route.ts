import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const envId = parseInt(id)
    
    if (isNaN(envId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }
    
    const servers = await prisma.harpenvserv.findMany({
      where: {
        envId: envId
      },
      select: {
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
            domain: true,
          }
        },
        statutenv: {
          select: {
            statenv: true,
            descr: true,
            icone: true,
          }
        }
      }
    })

    // Récupérer les descriptions des types de serveurs
    const serversWithDescr = await Promise.all(
      servers.map(async (server) => {
        let psadm_typsrv = null
        if (server.typsrv) {
          const typsrvData = await prisma.psadm_typsrv.findUnique({
            where: { typsrv: server.typsrv },
            select: { descr: true }
          })
          if (typsrvData) {
            psadm_typsrv = typsrvData
          }
        }
        return {
          ...server,
          psadm_typsrv
        }
      })
    )

    return NextResponse.json(serversWithDescr)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 })
  }
}

