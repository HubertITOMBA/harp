import HarpEnvPage from '@/components/harp/ListEnvs';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

const EnvSinglePage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  
  // Valider que l'ID est un nombre valide
  const typenvid = parseInt(id, 10);
  
  if (isNaN(typenvid) || typenvid <= 0) {
    return notFound();
  }

  // Vérifier que le typenvid existe dans harptypenv
  // Note: l'URL utilise typenvid (pas id), donc on cherche par typenvid
  const typenv = await prisma.harptypenv.findUnique({
    where: { typenvid: typenvid },
  });

  if (!typenv) {
    return notFound();
  }

  return (
    <div>
      <HarpEnvPage typenvid={typenvid} />
    </div>
  );
};

export default EnvSinglePage;
