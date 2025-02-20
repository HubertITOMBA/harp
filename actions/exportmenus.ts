"use client" 

import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { equal } from 'assert';
import { HarpserSchema } from '@/schemas';
import { getUserRoles } from '@/actions/menurigth';
import { useCurrentRole } from '@/hooks/use-current-role';
 



export async function getMenuRoles(menuId: number) {  

    const roles = useCurrentRole();

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
            menuId: menuId,
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
  }; 




  