import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { toast } from "react-toastify";
import { GenererLesMenus } from '@/actions/importharp';
import { MenuDashClient } from './MenuDashClient';
 

const menuItems = [
    {
      icon: "/ressources/profile.png",
      label: "Profile",
      href: "/profile",
      visible: ["PSADMIN", "admin", "teacher", "student", "parent"],
    },
    {
      icon: "/ressources/setting.png",
      label: "Parametres",
      href: "/settings",
      visible: ["PSADMIN", "admin", "teacher", "student", "parent"],
    },
    {
      icon: "/ressources/logout.png",
      label: "Deconnexion",
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
   
  const optionMenu = await prisma.harpmenus.findMany(
    {
       where : {
          level: 2, 
          active: 1,
        },
     orderBy: {
        display: "asc",
      },
    }
  );

  return (
    <MenuDashClient 
      optionMenu={optionMenu}
      menuItems={menuItems}
    />
  )
}

export default Menu