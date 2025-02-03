import FormModal from '@/components/harp/FormModal';
import Pagination from '@/components/harp/Pagination';
import Table from '@/components/harp/Table';
import TableSearch from '@/components/harp/TableSearch';
import { role } from '@/lib/data';
import prisma from '@/lib/prisma';
import { ITEM_PER_PAGE } from '@/lib/settings'
import { psadm_oracle, Prisma, psadm_env } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'


type InstOraList = psadm_oracle & { psadm_envs: psadm_env};

const renderRow = (item: InstOraList ) => (
  <tr key={item.aliasql}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-harpSkyLight"
  >
     
     <td className="hidden md:table-cell">{item.oracle_sid}</td>
     <td className="hidden md:table-cell">{item.aliasql}</td>
     <td className="hidden md:table-cell">{item.oraschema}</td>
     <td className="hidden md:table-cell">{item.orarelease}</td>
     <td className="hidden md:table-cell">{item.descr}</td>
     {/* <td className="hidden md:table-cell">{item.psadm_env.env}</td> */}
        <td>
         <div className="flex items-center gap-2">
              <Link href={`/list/instora/${item.aliasql}`}>
                  <button className="w-7 h-7 flex items-center justify-center rounded-full bg-fmkSky">
                     <Image src="/ressources/view.png" alt="" width={16} height={16}/>
                  </button>
                  <FormModal table="psadm_oracle" type="delete"/>
                  {role === "admin" && (
                  //   <button className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-500">
                  //    <Image src="/ressources/delete.png" alt="" width={16} height={16}/>
                  // </button>
                  <FormModal table="psadm_oracle" type="delete" id={item.aliasql}/>
                  )}
              </Link>
         </div>
      </td>
  </tr>
)

// oracle_sid    String      @db.Char(8)
//   aliasql       String      @db.VarChar(32)
//   oraschema     String      @db.Char(8)
//   descr         String      @db.VarChar(50)
//   orarelease    String?     @db.VarChar(32)
//   typenvid      Int?

const columns = [
    {
      header: "Oracle SID",
      accessor: "oracle_sid",
      className: "hidden lg:table-cell",
    },
    {
      header: "Alias SQL *Net",
      accessor: "aliasql",
      className: "hidden lg:table-cell",
    },
    {
      header: "Schema",
      accessor: "oraschema",
      className: "hidden lg:table-cell",
    },
   {
      header: "Release",
      accessor: "orarelease",
      className: "hidden lg:table-cell",
    },
     {
      header: "Description",
      accessor: "descr",
      className: "hidden lg:table-cell",
    },
    // {
    //   header: "Environnement",
    //   accessor: "psadm_env.env",
    //   className: "hidden lg:table-cell",
    // },
    ...(role === "PSADMIN"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];


const InstOraListPage = async (
    {
      searchParams,
    }: {
      searchParams: { [key: string]: string | undefined };
    }
) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page): 1;

 // URL PARAMS CONDITION
  const query : Prisma.psadm_oracleWhereInput ={};

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
              query.aliasql = {contains:value, lte:"insensitive"};
              break;
          default:
            break; 
          }
        }
    }
 }


  const [ data, count ] = await prisma.$transaction([
    prisma.psadm_oracle.findMany({
      where: 
      query,
      include: {
         psadm_env: true,
      //   classes: true,
       },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * ( p-1),
    }),  
    prisma.psadm_oracle.count({ where: query }),
    ])

  // console.log(data);
  // console.log("Nombre d'environnements : ", count);
  

  return (
    <div className='bg-white p-4 rounded-md flex-1 m-4 mt-0'>
        
        {/** TOP */}
        <div className="flex items-center justify-between">
            <h1 className='hidden md:block text-lg font-semibold'>Instances oracle  ( {count} ) </h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSky">
                        <Image src="/ressources/filter.png" alt="" width={14} height={14} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSkyLight">
                        <Image src="/ressources/sort.png" alt="" width={14} height={14} />
                    </button>
                   <FormModal table="psadm_srv" type="create"/>
                    {
                    role === "PSADMIN" && (
                    // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-fmkSkyLight">
                    //     <Image src="/ressources/plus.png" alt="" width={14} height={14} />
                    // </button>
                    <FormModal table="psadm_oracle" type="create"/>
                     )}
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

export default InstOraListPage