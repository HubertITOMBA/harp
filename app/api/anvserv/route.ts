import  prisma  from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const envId = parseInt(params.id)
    
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
        // psadm_typsrv: {
        //   select: {
        //     descr: true,
        //   }
        // },
        statutenv: {
          select: {
            statenv: true,
            descr: true,
            icone: true,
          }
        }
      }
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 })
  }
}