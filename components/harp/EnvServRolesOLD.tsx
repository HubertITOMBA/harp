import prisma from '@/lib/prisma';
import { Label } from "@/components/ui/label"
import Table from '@/components/harp/Table';
import React from 'react'
import Link from 'next/link';
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import InputField from '@/components/harp/InputField';
import { Prisma, psadm_rolesrv, psadm_srv } from '@prisma/client';
import TableSearch from './TableSearch';
import Pagination from './Pagination';

interface EnvInfoProps {
    env: string;
    srv: string;
    // headerLabel: string;
    // backButtonLabel: string;
    // backButtonHref: string;
};

type EnvListServ = psadm_rolesrv & { psadm_srv: psadm_srv}; 

const renderRow = (item: EnvListServ ) => (
  <tr key={item.env}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-harpSkyLight"
  >
    <td className="hidden md:table-cell">{item.srv}</td>
     <td className="hidden md:table-cell">{item.typsrv}</td>
     <td className="hidden md:table-cell">{item.status}</td> 
     <td className="hidden md:table-cell">{item.psadm_srv.ip}</td>
     <td className="hidden md:table-cell">{item.psadm_srv.pshome}</td>
     <td className="hidden md:table-cell">{item.psadm_srv.os}</td>
     <td className="hidden md:table-cell">{item.psadm_srv.psuser}</td>
 </tr>
)

const columns = [
    {
      header: "Serveur",
      accessor: "srv",
    },
    {
      header: "Type",
      accessor: "typsrv",
    },
    {
      header: "Status",
      accessor: "status",
    },
   {
      header: "Adresse Ip",
      accessor: "ip",
    },
     {
      header: "Ps_Home",
      accessor: "pshome",
     },
    {
      header: "Os",
      accessor: "os",
    },
    {
      header: "Ps User",
      accessor: "psuser",
    },
 ];

 const EnvServRoles = async ({
           searchParams,
         }: {
           searchParams: { [key: string]: string | undefined };
         }
     ) => {
       const { page, ...queryParams } = searchParams;
     //  const { page, ...queryParams } = searchParams;
       const p = page ? parseInt(page): 1;
     
      // URL PARAMS CONDITION
       const query : Prisma.psadm_rolesrvWhereInput ={};
     
      if (queryParams) {
         for (const [key, value] of Object.entries(queryParams)) {
             if (value !== undefined) {
               switch (key) {
                 // case "classId":  
                 //    query.lessons = {
                 //       some:{
                 //         classId:parseInt(value),
                 //       },
                 // };
                 // break;
                 case "rechercher":
                   query.srv = {contains:value, lte:"insensitive"};
                   break;
               default:
                 break; 
               }
             }
         }
        }

      const [ data ] = await prisma.$transaction([
         prisma.psadm_srv.findMany({
          select: {
            srv: true,
            ip: true,
            pshome: true,
            os: true,
            psuser: true,
            domain: true,
            psadm_rolesrv: {
              select: {
                env: true,
                typsrv: true,
                status: true
              }
            }
          },
          where: {
            psadm_rolesrv: {
              some: {
                env: "FHHPR1"
              }
            }
          },
          orderBy: {
            psadm_rolesrv: {
              typsrv: 'asc'
            }
          }
        }),
        // prisma.psadm_rolesrv.count({ where: query }),
      ])
     

  return (
    <div className='bg-white p-4 rounded-md flex-1 m-4 mt-0'>
        
    {/** TOP */}
    <div className="flex items-center justify-between">
        {/* <h1 className='hidden md:block text-lg font-semibold'>Instances oracle  ( {count} ) </h1> */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSky">
                    <Image src="/ressources/filter.png" alt="" width={14} height={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSkyLight">
                    <Image src="/ressources/sort.png" alt="" width={14} height={14} />
                </button>
              
            </div>
        </div>
    </div>
    {/** LIST*/}
    <div className=''>
        <Table columns={columns} renderRow={renderRow} data={data}/>
    </div>
    {/** PAGINATION */}
    <div className=''>
        <Pagination page={p} count={count}/>
    </div>
</div>
  )
}

export default EnvServRoles;
