import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const roles = await db.psadm_role.findMany({
      orderBy: {
        role: 'asc',
      },
      select: {
        role: true,
        descr: true,
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rôles' },
      { status: 500 }
    );
  }
}

