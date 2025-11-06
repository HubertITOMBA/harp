import Image from "next/image";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/components/auth/user-button";
import Link from "next/link";
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { parseRolesFromString, hasAnyRole } from '@/lib/user-roles';
import { NavbarMobileMenu } from "./navbar-mobile-menu";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { logOut } from "@/actions/logout";

interface RoleMenuProps {
  DroitsUser : string ;
}; 


const Navbar = async ({ DroitsUser }: RoleMenuProps) => {
   
    const droitsUtilisteur = DroitsUser;

    const optionMenu = await prisma.harpmenus.findMany(
      {
        where : {
          level: 1,
          active: 1,
       },
        orderBy: {
          display: "asc",
        },
      }
    );

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
        
        return {
          menuId: menu.id,
          rolesArray: allMenuRoles
        };
      })
    );

    // Créer un Map pour les tableaux de rôles
    const rolesArrayByMenuId = new Map(
      menuRoles.map(item => [item.menuId, item.rolesArray])
    );

    // Parser les rôles de l'utilisateur
    const userRolesArray = parseRolesFromString(droitsUtilisteur);

    // Filtrer les menus accessibles pour le menu mobile
    const accessibleMenuItems = optionMenu.filter((item) => {
      const menuRolesArray = rolesArrayByMenuId.get(item.id) || [];
      return menuRolesArray.length === 0 || hasAnyRole(userRolesArray, menuRolesArray);
    });

  return (
    <nav className="backdrop-blur-lg sticky top-0 z-[999]">
         <h1 className='my-4 md:my-10 text-xl md:text-2xl lg:text-3xl text-right font font-semibold text-orange-500 mb-1 px-2'>TMA HARP</h1> 
         <div className='h-2 w-full p-1 bg-orange-500'>
         </div >
    

    <div className="flex flex-col md:flex-row items-center justify-between p-2 gap-2">
      
        <div className="flex items-center gap-2 md:gap-5 justify-between md:justify-end w-full">
          {/* Menu mobile - dropdown */}
          <NavbarMobileMenu menuItems={accessibleMenuItems} />

          {/* Menu desktop - horizontal */}
          <div className="hidden md:flex w-full md:w-auto">
            <nav className="mx-auto flex max-w-7xl justify-between p-1 lg:px-4">
              <div className="flex items-center justify-between text-xs font-medium gap-2 md:gap-5">
                {optionMenu.map((item) => {
                  // Récupérer les rôles autorisés pour ce menu
                  const menuRolesArray = rolesArrayByMenuId.get(item.id) || [];
                  
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
                  return (
                    <div className="flex gap-2" key={item.display}>
                      <Link href={`${item.href}`}
                            className="flex items-center justify-center lg:justify-start gap-2 text-xs font-medium px-1 p-2 rounded-xl hover:text-orange-500 transition-colors"
                      >
                        {item.icone && item.icone !== "" && item.icone !== "N" ? (
                          <Image src={`/ressources/${item.icone}`} alt="" width={16} height={16} className="" />
                        ) : null}
                        <span className="hidden lg:block text-xs">{item.menu}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>          
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserButton />
        </div>
      </div>
    </nav>
  )
}

export default Navbar