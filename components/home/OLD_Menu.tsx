 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
 

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
   
  ]; 


const Menu = async () => {

  // const optionMenu = await prisma.harpmenus.findMany({
  //   // where: {
  //   //   id: 3, // Cette valeur sera dynamique
  //   // },
  //   select: {
  //     menu: true,
  //     id: true,
  //      display: true,
  //     // level: true,
  //     // href: true,
  //     // descr: true,
  //     icone: true,
  //     active: true,
  //     harpmenurole: {
  //       select: {
  //         // menuId: true,
  //         // roleId: true,
  //         harproles: {
  //           select: {
  //             role: true
  //           }
  //         }
  //       }
  //     }
  //   },
  //   distinct: ['id'],
  // });


  
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

  const rolesmenu = await prisma.harpmenurole.findMany({
    where: {
      //enuId: parseInt(optionMenu.map(menu => menu.id)),
      menuId: 3,
     },
     orderBy: {
       datmaj: 'desc'
     },
     include:{
       harproles: true,
    },            
  }); 
 

  // 2 const rolesmenu = await prisma.harpmenurole.findMany({
  //   where: {
  //     menuId: {
  //       in: optionMenu.map(menu => menu.id)
  //     },
  //   },
  //     select: {
  //       harproles: {
  //         where: {
  //           id: {
  //             equals: {
  //               roleId: true
  //             }
  //           }
  //         },
  //         select: {
  //           role: true
  //         }
  //       }
  //     }
  // });
 

  // Créer une chaîne de caractères avec tous les rôles
  const rolesString = optionMenu.map(menu => `"${menu.role}"`).join(', ');

  // Créer un objet pour stocker les descriptions par menuId
  // const menuDescriptions = optionMenu.reduce((acc, menu) => {
  //   const menuRoles = rolesmenu
  //     .filter(role => role.menuId === menu.id)
  //     .map(role => `"${role.harproles.descr}"`)
  //     .join(', ');
  //   acc[menu.id] = menuRoles;
  //   return acc;
  // }, {});

  //const descriptions = rolesmenu.map(menu => `"${menu.role.descr}"`).join(", ");



  return (
    <div className="mt-4 px-2 text-sm">
       
        ENVIRONNEMENTS
        {optionMenu.map(i =>  
             <div className="flex flex-col gap-2 my-1" key={i.menu}>
                  {/* <h2 className="text-gray-600 text-sm">{descriptions}</h2> */}
                  <h2 className="text-gray-600 text-sm">{rolesString}</h2>
                  {/* <span className='flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300'>{i.typenv}</span> */}
                  <Link
                          href={`/harp/envs/${i.display}`}
                          //href={`/harp/envs/${i.display}`}
                          // href={"/harp/envs/3"}
                          key={i.id} 
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

        
        {/* <div className="mt-10 flex flex-col gap-2">
            
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

        </div>   */}



            {/* {optionMenu.map(i =>  
              <div className="flex flex-col gap-2 my-1" key={i.display}>
                <Link
                  href={`/harp/envs/${i.display}`}
                  key={i.menu} 
                  className="flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300">
                  {i.icone !== "" ? 
                    <Image src={`/ressources/${i.icone}`} alt="" width={20} height={20} className="" /> 
                    : 
                    <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full"/>
                  }
                  <span className="hidden lg:block">{i.menu}</span>
                  <span className="hidden lg:block text-sm text-gray-500">
                    ({menuRolesMap[i.id]?.join(', ') || ''})
                  </span>
                </Link> 
              </div>
            )} */}
      
      

    </div>
  )
}

export default Menu;