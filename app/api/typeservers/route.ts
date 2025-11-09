import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const typeServers = await db.psadm_typsrv.findMany({
      orderBy: {
        typsrv: 'asc',
      },
      select: {
        typsrv: true,
        descr: true,
      },
    })

    return NextResponse.json(typeServers)
  } catch (error) {
    console.error('Erreur lors de la récupération des types de serveurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des types de serveurs' },
      { status: 500 }
    )
  }
}

