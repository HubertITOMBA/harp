import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appli: string; psversion: string }> }
) {
  try {
    const { appli, psversion } = await params;
    
    const decodedAppli = decodeURIComponent(appli);
    const decodedPsversion = decodeURIComponent(psversion);

    const appliData = await db.psadm_appli.findUnique({
      where: {
        appli_psversion: {
          appli: decodedAppli,
          psversion: decodedPsversion,
        },
      },
      include: {
        psadm_env: {
          select: {
            env: true,
          },
          take: 10,
        },
      },
    });

    if (!appliData) {
      return NextResponse.json({ error: 'Application non trouvée' }, { status: 404 });
    }

    return NextResponse.json(appliData);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'application:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'application' },
      { status: 500 }
    );
  }
}

