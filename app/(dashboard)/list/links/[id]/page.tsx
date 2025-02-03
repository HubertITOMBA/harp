 

import React from 'react'
import prisma from "@/lib/prisma";
import HarpEnvPage from '@/components/harp/ListEnvs';
import { useParams } from 'next/navigation';


const EnvSinglePage = () => {

    // const EnvHarp = await prisma.psadm_env.findUnique({
    //     where: {
    //         env: params.id,    
    //     },
    // });
  //  const params = useParams(); 

   // console.log("VALEUR RECUPEREE DEPUIS APPEL DE LA PAGE : ", params);
     
  //  console.log("VALEUR RECUPEREE LID : ", params.id);

   
    

  return (
    <div>
       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}    */}
       {/* <HarpEnvPage typenvid={params.id}/> */}

    </div>
  )
}


export default EnvSinglePage;



