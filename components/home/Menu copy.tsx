"use client" 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
import { getUserRoles } from '@/actions/menurigth';
import { useCurrentRole } from '@/hooks/use-current-role';
 

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

    

    const optionMenu = await prisma.harpmenus.findMany({
      where: {
        level: 3,
        active: 1,
      },
      orderBy: {
        display: "asc",
      },
    });
  
    // Récupérer les rôles pour chaque menu
    const menuRoles = await Promise.all(
      optionMenu.map(async (menu) => {
        const roles = await prisma.harpmenurole.findMany({
          where: {
            menuId: menu.id
          },
          select: {
            harproles: {
              select: {
                role: true
              }
            }
          }
        });
        
        // Créer la chaîne de rôles pour ce menu
        const rolesString = roles
          .map(role => `"${role.harproles.role}"`)
          .join(', ');
        
        return {
          menuId: menu.id,
          roles: rolesString
        };
      })
    );
  
    // Créer un Map pour un accès facile aux rôles par menuId
    const rolesByMenuId = new Map(
      menuRoles.map(item => [item.menuId, item.roles])
    );
 




  return (
    <div className="mt-4 px-2 text-sm">
       
        ENVIRONNEMENTS
        {/* {optionMenu.map(i =>  
             <div className="flex flex-col gap-2 my-1" key={i.menu}>
                   <Link
                          href={`/harp/envs/${i.display}`}
                           key={i.id} 
                          className="flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300">
                          data-roles={rolesByMenuId.get(i.id)} 
                             
                          { i.icone !== "" ? 
                          <Image src={`/ressources/${i.icone}`}alt="" width={20} height={20} className="" /> 
                            : 
                          <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full"/>
                          }
                           <span className="hidden lg:block">{i.menu}</span>  
                      </Link> 
              </div>
        )} */}
       
       {optionMenu.map(async (i) => {
        const userRoles = await getUserRoles(24);
        const menuRolesStr = rolesByMenuId.get(i.id) || "";
        const menuRoles = menuRolesStr.split(', ').map(r => r.replace(/"/g, ''));
        
        const hasMatchingRole = menuRoles.length === 0 || menuRoles.some(menuRole =>
          userRoles.includes(menuRole)
        );

        return (
          <div className="flex flex-col gap-2 my-1" key={i.menu}>
            {hasMatchingRole}
            {hasMatchingRole && (
              <Link
                href={`/harp/envs/${i.display}`}
                key={i.id}
                className="flex items-center justify-center lg:justify-start gap-4 text-bold px-2 rounded-md hover:bg-orange-300"
              >
                {i.icone !== "" ? (
                  <Image src={`/ressources/${i.icone}`} alt="" width={20} height={20} className="" />
                ) : (
                  <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full" />
                )}
                <span className="hidden lg:block">{i.menu}</span>
              </Link>
            )}
          </div>
        );
      })}
      
    </div>
  )
}

export default Menu;