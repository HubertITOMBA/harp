 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
import { getUserRoles } from '@/actions/menurigth';
import { parseRolesFromString, hasAnyRole } from '@/lib/user-roles';
import { EnvLink } from './EnvLink';
 


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
  
    // Récupérer les rôles pour chaque menu (harpmenus.role + harpmenurole via harproles)
    const menuRoles = await Promise.all(
      optionMenu.map(async (menu) => {
        // Récupérer les rôles depuis harpmenurole via harproles
        const menuRoleRelations = await prisma.harpmenurole.findMany({
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
        
        // Créer un tableau de tous les rôles autorisés pour ce menu
        const allMenuRoles: string[] = [];
        
        // 1. Ajouter le rôle principal du menu (harpmenus.role) s'il existe
        // Conversion explicite en string pour garantir la compatibilité
        if (menu.role) {
          allMenuRoles.push(String(menu.role));
        }
        
        // 2. Ajouter les rôles depuis harpmenurole via harproles
        menuRoleRelations.forEach(relation => {
          if (relation.harproles?.role) {
            // Conversion explicite en string pour garantir la compatibilité
            allMenuRoles.push(String(relation.harproles.role));
          }
        });
        
        // Créer la chaîne de rôles formatée pour l'affichage
        const rolesString = allMenuRoles
          .map(role => `"${role}"`)
          .join(', ');
        
        return {
          menuId: menu.id,
          roles: rolesString,
          rolesArray: allMenuRoles // Garder aussi le tableau pour la comparaison
        };
      })
    );
  
    // Créer un Map pour un accès facile aux rôles par menuId
    const rolesByMenuId = new Map(
      menuRoles.map(item => [item.menuId, item.roles])
    );
    
    // Créer un Map pour les tableaux de rôles
    const rolesArrayByMenuId = new Map(
      menuRoles.map(item => [item.menuId, item.rolesArray])
    );

  

 
  const userRolesArray = parseRolesFromString(droitsUtilisteur);

  return (
    <div className="mt-4 px-2 text-xs">
      {/* Connexion en cours : {sessionCount} 
      ENVIRONNEMENTS */}
             
       {optionMenu.map((i) => {
       
       // Récupérer les rôles autorisés pour ce menu (harpmenus.role + harpmenurole via harproles)
       const menuRolesArray = rolesArrayByMenuId.get(i.id) || [];
       const menuRolesStr = rolesByMenuId.get(i.id) || "";
       
       // Vérifier si l'utilisateur a au moins un des rôles requis pour ce menu
       // Selon le PROMPTEUR : Afficher le menu et son icône seulement si dans la fusion des rôles du menu
       // (harpmenus.role + harpmenurole via harproles) on retrouve un ou plusieurs rôles identiques
       // de la fusion des rôles de l'utilisateur (User.role + harpuseroles via harproles)
       // 
       // Le menu est affiché si :
       // - Le menu n'a aucun rôle défini (accessible à tous) OU
       // - Le menu a au moins un rôle défini ET l'utilisateur a au moins un rôle correspondant
       const hasAccess = menuRolesArray.length === 0 || hasAnyRole(userRolesArray, menuRolesArray);
       
       // Ne pas rendre le menu si l'utilisateur n'a pas accès
       if (!hasAccess) {
         return null;
       }
       
       // Afficher l'icône seulement si le menu est visible (hasAccess = true)
       // Utiliser EnvLink pour une navigation fiable avec revalidation
       return (
         <EnvLink
           key={i.id}
           href={`/harp/envs/${i.display}`}
           icon={i.icone}
           label={i.menu}
         />
       );
        })}
      {/* <p>Mes DROITS = { droitsUtilisteur }</p> */}
       

    </div>
  )
}

export default Menu;