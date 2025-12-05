'use client';
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50'>
      <Image
        src='/images/portailLogo.png'
        width={100}
        height={100}
        alt={`${APP_NAME} logo`}
        priority={true}
      />
      <div className='p-6 w-full max-w-md rounded-lg shadow-md text-center bg-white border border-orange-200'>
        <h1 className='text-3xl font-bold mb-4 text-slate-900'>Oupss ... Page non trouvée !</h1>
        <p className='text-destructive mb-4'>Impossible de trouver la page demandée</p>
        <p className='text-sm text-slate-600 mb-6'>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Button
          variant='outline'
          className='mt-4'
          onClick={() => router.push('/')}
        >
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
