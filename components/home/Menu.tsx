 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
import { getUserRoles } from '@/actions/menurigth';
 


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


  interface RoleMenuProps {
    DroitsUser : string ;
    sessionCount: number;
  };  

const Menu = async ({ DroitsUser, sessionCount }: RoleMenuProps) => {

    const droitsUtilisteur = DroitsUser; 
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

    const fatiha =  ["PUM", "DMOSTD", "POC92", "TMA_LOCAL", "REF", "DRP"];
    const lemenu =  ["POC92", "DRP", "DADS"];
    console.log("LE MENU FILTER INCLUDE FATIHA ",lemenu.filter(e => fatiha.includes(e))); 

  return (
    <div className="mt-4 px-2 text-sm">
      Connexion en cours : {sessionCount} 
      ENVIRONNEMENTS
             
       {optionMenu.map(async (i) => {
       
       const menuRolesStr = rolesByMenuId.get(i.id) || "";
       const menuRoles = menuRolesStr.split(', ').map(r => r.replace(/"/g, ''));
      
       // if (menuRoles.some(menuRole =>  droitsUtilisteur.includes(menuRole))){
        //  if (menuRolesStr.filter(menuRole =>  droitsUtilisteur.includes(menuRole))){
        // if (menuRolesStr.includes(droitsUtilisteur)){
            if (droitsUtilisteur.includes(menuRolesStr)){
          return (
            
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
                      <span className="hidden lg:block text-red-500 font-semibold">{menuRolesStr}</span>
                </Link>
                  
                

               )
          }
          return null; // Ajout d'un return null pour les éléments qui ne correspondent pas
        })}
      {/* <p>Mes DROITS = { droitsUtilisteur }</p> */}
       

    </div>
  )
}

export default Menu;