"use client" 

import Link from 'next/link'
import Image from 'next/image'
// import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
import { getMenuRoles, getUserRoles } from '@/actions/menurigth';
import { useCurrentRole } from '@/hooks/use-current-role';
import { useCurrentUser } from '@/hooks/use-current-user';
import { auth } from '@/auth';
 

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
  
  const session = await auth();

  if (!session?.user?.id) {
    return null; // Ou afficher un message/composant pour les utilisateurs non connectés
  }

  const roles = await getUserRoles(session.user.id);

    // const user =  useCurrentUser();
    // const roles = await getUserRoles()
    //  const roles = useCurrentRole();


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
    // const menuRoles = await Promise.all(
    //   optionMenu.map(async (menu) => {
    //     const roles = await prisma.harpmenurole.findMany({
    //       where: {
    //         menuId: menu.id
    //       },
    //       select: {
    //         harproles: {
    //           select: {
    //             role: true
    //           }
    //         }
    //       }
    //     });
        
        // Créer la chaîne de rôles pour ce menu
    //     const rolesString = roles
    //       .map(role => `"${role.harproles.role}"`)
    //       .join(', ');
        
    //     return {
    //       menuId: menu.id,
    //       roles: rolesString
    //     };
    //   })
    // );
  
    // Créer un Map pour un accès facile aux rôles par menuId
    // const rolesByMenuId = new Map(
    //   menuRoles.map(item => [item.menuId, item.roles])
    // );
 
  return (
    <div className="mt-4 px-2 text-sm">
               
           { await Promise.all(optionMenu.map(async (i) => {
                const menuRolesStr = await getMenuRoles(i.id) || "";
                const menuRoles = menuRolesStr.split(', ').map(r => r.replace(/"/g, ''));
                
                const hasMatchingRole = menuRoles.length === 0 || menuRoles.some(menuRoles =>
                    roles?.includes(menuRoles)
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
            }))}
      
    </div>
  )
}

export default Menu;