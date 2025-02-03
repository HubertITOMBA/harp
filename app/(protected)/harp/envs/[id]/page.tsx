// "use client"
import React from 'react'
//import { useParams } from 'next/navigation';
// import { useSearchParams } from 'next/navigation';
import prisma from "@/lib/prisma";
import HarpEnvPage from '@/components/harp/ListEnvs';

import { getharpEnv } from '@/actions/harpenvs';
import { Prisma } from '@prisma/client';
import Pagination from '@/components/harp/Pagination';


const EnvSinglePage = async ({ params }: { params: { id: string } }) => {
// const EnvSinglePage = async(
//   // {params}
//  // {id} : {id: string;} 
//      {  params: { id } }: { params: { id: string }; }
//   ) => {
  
    //   params: { id },
    // }: {
    //   params: { id: string };

  // const searchParams = useSearchParams();
  // const newParam = searchParams.get('id')
  // const id = await params;
  // console.log("LA CLE PROPS et SA VALEUR : ", id);

    //   const EnvHarp = await prisma.psadm_env.findUnique({
    //     where: {
    //         env: params.id,    
    //     },
    // });
    //export default function EnvSinglePage({ params }: any)  {
    //const params = useParams(); 
   // console.log("VALEUR RECUPEREE DEPUIS SEARCH PARAMS : ", {params});
     //console.log("VALEUR DE PAGE : ", page);

    // const DescEnvs = getharpEnv(params.id);  
    //   const getharpEnv = async() => {
    //     try {
          
    //     } catch (error) {
    //       console.log(error);
          
    //     }
    //   };  


    //  useEffect(() => {
    //       getharpEnv(params.id)
    //  }, []);

    // const searchParams = useSearchParams();
   
   // const newParam = searchParams.get('new')
   // console.log(searchParams);

    // console.log("VALEUR RECUPEREE DEPUIS ACTION : ", searchParams);


  //   const { page, ...queryParams } = searchParams;
  //   const p = page ? parseInt(page): 1;
  
  //  // URL PARAMS CONDITION
  //   const query : Prisma.psadm_envWhereInput ={};
  
  //  if (queryParams) {
  //     for (const [key, value] of Object.entries(queryParams)) {
  //         if (value !== undefined) {
  //           switch (key) {
  //               case "rechercher":
  //                 query.env = {contains:value, lte:"insensitive"};
  //               break;
  //           default:
  //             break; 
  //           }
  //         }
  //     }
  //  }   
   
  // const typenvid = await parseInt(params.id);
 // const { id } = await parseInt(params);
  const { id } = await params;

  return (
    <div>
       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}   
        <HarpEnvPage />
       */}
      {/* PARAMETRES ==  {params.id}       <HarpEnvPage typenvid ={parseInt(params.id)}/>
       <HarpEnvPage typenvid = {parseInt(id)} /> */}
       <HarpEnvPage typenvid = {parseInt(id)} />

    </div>
  )
}

export default  EnvSinglePage 
 



