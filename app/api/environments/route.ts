import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const environments = await db.psadm_env.findMany({
      orderBy: {
        env: 'asc',
      },
      select: {
        env: true,
        descr: true,
        site: true,
      },
    })

    return NextResponse.json(environments)
  } catch (error) {
    console.error('Erreur lors de la récupération des environnements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des environnements' },
      { status: 500 }
    )
  }
}

