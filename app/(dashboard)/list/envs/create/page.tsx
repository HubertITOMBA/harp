
import EnvForm from '@/components/admin/env-form';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Créér Environnement',
};

const CreateEnvpage = () => {
    return (
      <div className='px-5'>
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center rounded-xl px-4'>
           <div className="px-4 bg-white rounded-xl w-full max-w-md shadow-2xl">
          <h2 className='h2-bold'>Créer un environnement</h2>
            <div className=' px-5 my-8'>
              <EnvForm type='Créer' />
            </div>
       </div>
        </div>
        </div>
      );
}
 
export default CreateEnvpage;