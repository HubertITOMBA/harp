 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
 

// DADS
// DMOSTD
// DRP
// EFO
// FR-FT-UNIX
// FT-MOE
// HP_MUTUALISE
// METRO
// POC92
// PORTAL_ADMIN
// PORTAL_SECURITY
// PSADMIN
// PUM
// REF
// REFRESH_INFOS
// TMA_LOCAL
// TMA_OFFSHORE
// UPDSTATUS_DEV
// UPGRADE92


const menuItems = [
    // {
    //   title: "ENVIRONNEMENTS",
    //   items: [
    //     {
    //       icon: "/ressources/home.png",
    //       label: "DEVOPS 1",
    //       href: "/harp/envs/${3}",
    //       visible: ["admin", "teacher", "student", "PSADMIN"],
    //     },
    //     {
    //       icon: "/ressources/teacher.png",
    //       label: "DEVOPS 2",  
    //       href: "/harp/envs/${4}",
    //       visible: ["PSADMIN", "teacher"],
    //     },
    //     {
    //       icon: "/ressources/student.png",
    //       label: "DEVOPS FUSION",
    //       href: "/harp/envs/${5}",
    //       visible: ["PSADMIN", "teacher"],
    //     },
    //     {
    //       icon: "/ressources/parent.png",
    //       label: "DEVELOPPEMENT PROJET",
    //       href: "/harp/envs/${6}",
    //       visible: ["PSADMIN", "teacher"],
    //     },
    //     {
    //       icon: "/ressources/subject.png",
    //       label: "DEVELOPPEMENT HOTFIX",
    //       href: "/harp/envs/${7}",
    //       visible: ["PSADMIN"],
    //     },
    //     {
    //       icon: "/ressources/class.png",
    //       label: "TMA",
    //       href: "/harp/envs/8",
    //       visible: ["PSADMIN", "teacher"],
    //     },harpmenus
    //       href: "/harp/envs/9",
    //       visible: ["PSADMIN", "teacher"],
    //     },
    //     {
    //       icon: "/ressources/exam.png",
    //       label: "RECETTE",
    //       href: "/harp/envs/10",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/assignment.png",
    //       label: "PRE-PRODUCTION",
    //       href: "/harp/envs/11",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/result.png",
    //       label: "PRODUCTION",
    //       href: "/harp/envs/12",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/attendance.png",
    //       label: "SECOURS - DRP",
    //       href: "/harp/envs/13",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/calendar.png",
    //       label: "REFERENCE LIVRAISON",
    //       href: "/harp/envs/15",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/message.png",
    //       label: "PSADMIN",
    //       href: "/harp/envs/16",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/announcement.png",
    //       label: "POC92",
    //       href: "/harp/envs/19",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //     {
    //       icon: "/ressources/announcement.png",
    //       label: "PUM-MAINTENANCE PS",
    //       href: "/harp/envs/21",
    //       visible: ["PSADMIN", "teacher", "student", "parent"],
    //     },
    //   ],
    // },
    // {
      // title: "DIVERS",
      // items: [
        {
          icon: "/ressources/user-pen.png",
          label: "Profile",
          href: "/profile",
          visible: ["PSADMIN", "admin", "teacher", "student", "parent"],
        },
        {
          icon: "/ressources/settings.png",
          label: "Settings",
          href: "/settings",
          visible: ["PSADMIN", "admin", "teacher", "student", "parent"],
        },
        {
          icon: "/ressources/log-out.png",
          label: "Logout",
          href: "/logout",
          visible: ["PSADMIN", "admin", "teacher", "student", "parent"],
        },                          
    //   ],
    // },
  ]; 


const Menu = async () => {

 // const optionMenu = await prisma.psadm_typenv.findMany(
  const optionMenu = await prisma.harpmenus.findMany(
    {
      where: {
        level: 3,
        active: 1,
      },
      orderBy: {
        display: "asc",
      },
    }
  );



  return (
    <div className="mt-4 px-2 text-sm">
       
        ENVIRONNEMENTS
        {optionMenu.map(i =>  
             <div className="flex flex-col gap-2 my-1" key={i.display}>
                  {/* <span className='flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300'>{i.typenv}</span> */}
                  <Link
                          href={`/harp/envs/${i.display}`}
                          //href={`/harp/envs/${i.display}`}
                          // href={"/harp/envs/3"}
                          key={i.menu} 
                          className="flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300">
                           {/* <Image src={i.icone} alt='' width={20} height={20} />   */}
                             
                          { i.icone !== "" ? 
                          <Image src={`/ressources/${i.icone}`}alt="" width={20} height={20} className="" /> 
                            : 
                          <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full"/>
                          }
                           <span className="hidden lg:block">{i.menu}</span>  
                      </Link> 
              </div>
        )}

        
        <div className="mt-10 flex flex-col gap-2">
            
            {menuItems.map(item =>{ 
                if(item.visible.includes(role)){
                  return (
                    <Link 
                        href={item.href} 
                        key={item.label} 
                        className="flex text-xl justify-left lg:justify-start gap-4 rounded-md hover:bg-orange-300">
                        <Image src={item.icon} alt='' width={20} height={20} />  
                          <span className="hidden lg:block">{item.label}</span>
                    </Link>
                  );
                  }
              })}

        </div>  


         {/* {menuItems.map(i=>(
            <div className="flex flex-col gap-2" key={i.title}>
                <span className='hidden lg:block text-gray-400 font-light my-4'>{i.title}</span>
                {i.items.map(item =>{
                   if(item.visible.includes(role)){
                    return (
                      <Link 
                          href={item.href} 
                          key={item.label} 
                          className="flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300">
                          <Image src={item.icon} alt='' width={20} height={20} />  
                           <span className="hidden lg:block">{item.label}</span>
                      </Link>
                    );
                   }
                })}
            </div>
        ))} */}


         
          {/*
          
          <Server />
          
          {menuItems.map(i=>(
            <div className="flex flex-col gap-2" key={i.label}>
                <span className='hidden lg:block text-gray-400 font-light my-4'>{i.title}</span>
               
            </div>
        ))} */}


    </div>
  )
}

export default Menu;