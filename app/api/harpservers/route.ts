import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const servers = await db.harpserve.findMany({
      orderBy: {
        srv: 'asc',
      },
      select: {
        id: true,
        srv: true,
        ip: true,
        os: true,
      },
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des serveurs' },
      { status: 500 }
    )
  }
}

