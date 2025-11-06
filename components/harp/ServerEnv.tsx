//import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/harp/Pagination";
import Table from "@/components/harp/Table";
import TableSearch from "@/components/harp/TableSearch";
import prisma from "@/lib/prisma";
import { psadm_srv, psadm_env, Prisma,psadm_rolesrv } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { role } from "@/lib/data";
import { ServerConnectionButtons } from "@/components/ui/server-connection-buttons";
 

type ServerList = psadm_srv & { psadm_rolesrv: psadm_rolesrv};

const ServerEnvPage = async ({qlenv} : {qlenv: string;} ) => {
  // const { sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Serveur",
      accessor: "srv",
    },
    {
      header: "Ps Home",
      accessor: "pshome",
    },
    {
      header: "Ip",
      accessor: "ip",
    },
    {
      header: "Psoft User",
      accessor: "psuser",
      },
    {
      header: "Os",
      accessor: "os",
     },
    {
      header: "Type",
      accessor: "typsrv",
     },
    {
      header: "Connexion",
      accessor: "connection",
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


  const renderRow = (item: ServerList) => (
    <tr
      key={item.index}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.srv}</td>
      <td >{item.psadm_srv?.pshome}</td>
      <td >{item.psadm_srv?.ip}</td>
      <td>{item.psadm_srv?.psuser}</td>
      <td> {item.psadm_srv?.os}</td>
      <td >{item.typsrv}</td>
      <td className="p-4">
        <ServerConnectionButtons 
          ip={item.psadm_srv?.ip}
          srv={item.srv}
          psuser={item.psadm_srv?.psuser}
          className="justify-center"
        />
      </td>
    </tr>
  );
 
console.log("CA CEST QUEL ENV", qlenv);


  const [ data, count ] = await prisma.$transaction([
    prisma.psadm_rolesrv.findMany({
      where: {
        env: qlenv,
       },
      include: {
        psadm_srv: {
            select : {
              srv : true,
              ip  : true,
              pshome : true,
              os : true,
              psuser : true,
              domain : true,
            },

        },  
      },
      take: ITEM_PER_PAGE,
      // skip: ITEM_PER_PAGE * ( p-1),
    }),  
    prisma.psadm_rolesrv.count({ where:  {
      env: qlenv,
    }, }),
    ])

 
    
    {/**


      include: {
        psadm_srv: {
          select: {srv: true},

        },  


      
       const roleServ = await db.psadm_rolesrv.findUnique({ where: {  
                                                                   env : enfInfos?.env,
                                                                   typsrv: {
                                                                      equals:  "DB"}}}); 
           const serverInfo = await db.psadm_srv.findUnique({ where: { srv :  roleServ?.srv }});  
      
      */}

  return (
    <div className="bg-muted/50 p-4 rounded-md flex-1 m-4 mt-0">
     
      <Table columns={columns} renderRow={renderRow} data={data} />
    
    </div>
  );
};

export default ServerEnvPage;
