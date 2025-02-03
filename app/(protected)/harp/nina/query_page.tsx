import FormModal from '@/components/harp/FormModal';
import Pagination from '@/components/harp/Pagination';
import Table from '@/components/harp/Table';
import TableSearch from '@/components/harp/TableSearch';
import { role } from '@/lib/data';
import prisma from '@/lib/prisma';
import { ITEM_PER_PAGE } from '@/lib/settings'
import { psadm_env, Prisma } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'


type EnvList = psadm_env ;

const renderRow = (item: EnvList ) => (
  <tr key={item.env}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-harpSkyLight"
  >
     
     {/* <td className="hidden md:table-cell">{item.display}</td> */}
     <td className="hidden md:table-cell">{item.env}</td>
     {/* <td className="hidden md:table-cell">{item.site}</td> */}
     <td className="hidden md:table-cell">{item.typenv}</td>
     <td className="hidden md:table-cell">{item.url}</td>
     <td className="hidden md:table-cell">{item.oracle_sid}</td>
     {/* <td className="hidden md:table-cell">{item.aliasql}</td> */}
     <td className="hidden md:table-cell">{item.oraschema}</td>
     <td className="hidden md:table-cell">{item.appli}</td>
     <td className="hidden md:table-cell">{item.psversion}</td>
     <td className="hidden md:table-cell">{item.ptversion}</td>
     <td className="hidden md:table-cell">{item.harprelease}</td>
     {/* <td className="hidden md:table-cell">{item.volum}</td> */}
     {/* <td className="hidden md:table-cell">{new Intl.DateTimeFormat("fr-FR").format(item.datmaj)}</td> */}
     {/* <td className="hidden md:table-cell">{item.gassi}</td>
     <td className="hidden md:table-cell">{item.rpg}</td>
     <td className="hidden md:table-cell">{item.msg}</td>
    <td className="hidden md:table-cell">{item.descr}</td> */}
    <td className="hidden md:table-cell">{item.anonym}</td>
    <td className="hidden md:table-cell">{item.edi}</td>
     <td>
         <div className="flex items-center gap-2">
              <Link href={`/list/envs/${item.env}`}>
                  <button className="w-7 h-7 flex items-center justify-center rounded-full bg-fmkSky">
                     <Image src="/ressources/view.png" alt="" width={16} height={16}/>
                  </button>
                  <FormModal table="psadm_env" type="delete"/>
                  {role === "admin" && (
                  //   <button className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-500">
                  //    <Image src="/ressources/delete.png" alt="" width={16} height={16}/>
                  // </button>
                  <FormModal table="psadm_env" type="delete" id={item.env}/>
                  )}
              </Link>
         </div>
      </td>
  </tr>
)

const columns = [
    // {
    //   header: "Ordre",
    //   accessor: "display",
    //   className: "hidden md:table-cell",
    // },
    {
      header: "Environnement",
      accessor: "env",
    },
    // {
    //   header: "Site PS",
    //   accessor: "site",
    //   className: "hidden md:table-cell",
    // },
    {
      header: "Type",
      accessor: "typenv",
      className: "hidden md:table-cell",
    },
    {
      header: "Url",
      accessor: "url",
      className: "hidden md:table-cell",
    },
    {
      header: "SID",
      accessor: "oracle_sid",
      className: "hidden lg:table-cell",
    },
    // {
    //   header: "Alias",
    //   accessor: "aliasql",
    //   className: "hidden lg:table-cell",
    // },
    {
      header: "Schema",
      accessor: "oraschema",
      className: "hidden lg:table-cell",
    },
    {
      header: "Appli",
      accessor: "appli",
      className: "hidden lg:table-cell",
    },
    {
      header: "PSoft",
      accessor: "psversion",
      className: "hidden lg:table-cell",
    },
    {
      header: "PTools",
      accessor: "ptversion",
      className: "hidden lg:table-cell",
    },
   {
      header: "Release",
      accessor: "harprelease",
      className: "hidden lg:table-cell",
    },
  //  {
  //     header: "volumétrie",
  //     accessor: "volum",
  //     className: "hidden lg:table-cell",
  //   },
  //   {
  //     header: "Date Modification",
  //     accessor: "datmaj",
  //     className: "hidden lg:table-cell",
  //   },
    // {
    //   header: "Gassi",
    //   accessor: "gassi",
    //   className: "hidden lg:table-cell",
    // },
    // {
    //   header: "rpg",
    //   accessor: "rpg",
    //   className: "hidden lg:table-cell",
    // },
    // {
    //   header: "Message",
    //   accessor: "msg",
    //   className: "hidden lg:table-cell",
    // },
    // {
    //   header: "Description",
    //   accessor: "descr",
    //   className: "hidden lg:table-cell",
    // },
   {
      header: "Anonymise",
      accessor: "anonym",
      className: "hidden lg:table-cell",
    },
    {
      header: "EDI",
      accessor: "edi",
      className: "hidden lg:table-cell",
    },
    ...(role === "PSADMIN"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];


const EnvListPage = async (
    {
      searchParams,
    }: {
      searchParams: { [key: string]: string | undefined };
    }
) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page): 1;

 // URL PARAMS CONDITION
  const query : Prisma.psadm_envWhereInput ={};

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
              query.env = {contains:value, lte:"insensitive"};
              break;
          default:
            break; 
          }
        }
    }
 }


  const [ data, count ] = await prisma.$transaction([
    prisma.psadm_env.findMany({
      where: 
      query,
      // include: {
      //   subjects: true,
      //   classes: true,
      // },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * ( p-1),
    }),  
    prisma.psadm_env.count({ where: query }),
    ])

  console.log(data);
  console.log("Nombre d'environnements : ", count);
  

  return (
    <div className='bg-white p-4 rounded-md flex-1 m-4 mt-0'>
        
        {/** TOP */}
        <div className="flex items-center justify-between">
            <h1 className='hidden md:block text-lg font-semibold'>Tous les environnements  ( {count} ) </h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSky">
                        <Image src="/ressources/filter.png" alt="" width={14} height={14} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-harpSkyLight">
                        <Image src="/ressources/sort.png" alt="" width={14} height={14} />
                    </button>
                   <FormModal table="psadm_env" type="create"/>
                    {
                    role === "PSADMIN" && (
                    // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-fmkSkyLight">
                    //     <Image src="/ressources/plus.png" alt="" width={14} height={14} />
                    // </button>
                    <FormModal table="psadm_env" type="create"/>
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

export default EnvListPage