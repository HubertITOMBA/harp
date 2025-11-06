import Link from 'next/link'
import Image from 'next/image'
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";
import { toast } from "react-toastify";
import { GenererLesMenus } from '@/actions/importharp';
 

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
    <div className="mt-4 px-2 text-xs">
     
        {optionMenu.map((item) => {
          // Afficher tous les menus sans restriction de rôles
          // Tous les menus sont visibles pour les utilisateurs ayant accès au dashboard (PSADMIN ou PORTAL_ADMIN)
          return (
            <div className="flex gap-2" key={item.menu}>
              <Link href={`${item.href}`}
                    className="flex items-center justify-center lg:justify-start gap-2 text-xs px-1 p-2 rounded-xl hover:bg-orange-300 transition-colors "
              >
                {item.icone && item.icone !== "" && item.icone !== "N" ? (
                  <Image src={`/ressources/${item.icone}`} alt="" width={16} height={16} className="" />
                ) : (
                  <Image src={`/ressources/list.png`} alt="" width={16} height={16} className="rounded-full"/>
                )}
                <span className="hidden lg:block text-xs">{item.menu}</span>
              </Link>
            </div>
          );
        })} 


        <div className="mt-10 flex flex-col gap-2">
            {menuItems.map(item =>{ 
                if(item.visible.includes(role)){
                  return (
                    <Link 
                        href={item.href} 
                        key={item.label} 
                        className="flex text-xs justify-left lg:justify-start gap-2 rounded-md hover:text-orange-500 transition-colors">
                        <Image src={item.icon} alt='' width={16} height={16} />  
                          <span className="hidden lg:block text-xs">{item.label}</span>
                    </Link>
                  );
                  }
              })}

        </div>
    </div>
  )
}

export default Menu