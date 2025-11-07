import HarpEnvPage from '@/components/harp/ListEnvs';

const EnvSinglePage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;

  return (
    <div>
      <HarpEnvPage typenvid={parseInt(id)} />
    </div>
  );
};

export default EnvSinglePage;
