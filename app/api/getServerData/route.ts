//import  db  from '@/lib/db'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await db.psadm_rolesrv.findMany({
      where: {
        env: 'FHHPR1'
      },
      include: {
        psadm_srv: true
      }
    })

    // Formater les données pour correspondre à notre type JoinResult
    const formattedData = data.map(item => ({
      srv: item.srv,
      ip: item.psadm_srv.ip,
      pshome: item.psadm_srv.pshome,
      os: item.psadm_srv.os,
      psuser: item.psadm_srv.psuser,
      domain: item.psadm_srv.domain,
      env: item.env,
      typsrv: item.typsrv,
      status: item.status
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}