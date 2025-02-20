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

    // Vérifier si la table est vide
    //  const count = await prisma.harpmenus.count();
    //       if (count == 0) {
    //         GenererLesMenus();
    //     toast.info("La table harpmenus contient déjà des données. Importation ignorée.");
    //   // return { info: "La table harpmenus contient déjà des données. Importation ignorée." };
    //  } 
   
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
    <div className="mt-4 px-2 text-sm">
     
        {optionMenu.map((item)  =>  
            <div className="flex gap-2 text-sm" key={item.menu}>
                <Link href={`${item.href}`}
                          className="flex items-center justify-center lg:justify-start gap-4 px-1 p-2 rounded-xl hover:bg-orange-300"
                    >

                          { item.icone !== "" ? 
                          <Image src={`/ressources/${item.icone}`}alt="" width={20} height={20} className="" /> 
                            : 
                          <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full"/>
                          } 
                        <span className="hidden lg:block">{item.menu}</span> 
                      
                    </Link> 
              </div>
          )} 


        <div className="mt-10 flex flex-col gap-2">
                    
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

        </div>  

    </div>
  )
}

export default Menu