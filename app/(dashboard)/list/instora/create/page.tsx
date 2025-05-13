
import InstanceForm from '@/components/admin/instance-form';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Créér Instance Oracle',
};

const CreateEnvpage = () => {
    return (
        <div className='px-4'>
          <h2 className='h2-bold'>Créer une instance oracle</h2>
            <div className='my-8'>
              <InstanceForm type='Créer' />
            </div>

        </div>
      );
}
 
export default CreateEnvpage;