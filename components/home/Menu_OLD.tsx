
import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
// import { getUserRoles } from '@/actions/menurigth';
// import { useCurrentRole } from '@/hooks/use-current-role';


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

  interface MenuProps {
    userRoles: string | undefined;
  }

// const Menu = async ({ userRoles}) => {
  const Menu: React.FC<MenuProps> = ({ userRoles }) => {
    console.log("Roles reçus dans Menu:", userRoles); 


   const rolessession  =  userRoles;
    
   'use server';
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

         {/* Affichez les rôles si nécessaire */}
      {userRoles && userRoles.map((role, index) => (
        <div key={index}>{role}</div>
      ))}     
      
      
    </div>
  )
}

export default Menu;