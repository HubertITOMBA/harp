
import EnvForm from '@/components/admin/env-form';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Créér Environnement',
};

const CreateEnvpage = () => {
    return (
        <>
          <h2 className='h2-bold'>Créer un environnement</h2>
            <div className='my-8'>
              <EnvForm type='Créer' />
            </div>

        </>
      );
}
 
export default CreateEnvpage;