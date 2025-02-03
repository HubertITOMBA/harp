import Image from "next/image";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/components/auth/user-button";
import Link from "next/link";
import { role } from '@/lib/data';
import prisma from "@/lib/prisma";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"



const navigation = [
    // { name: "Environnements", href: '/' },
    { name: "Self-service", href: '/program' , visible: ["PSADMIN", "admin", "teacher", "student", "parent"]},
    { name: "Refresh Infos", href: '/galery', visible: ["PSADMIN", "admin", "teacher", "student", "parent"] },
    { name: "Recherche", href: '/galery' , visible: ["PSADMIN", "admin", "teacher", "student", "parent"]},
    { name: 'Statacm', href: '/agenda' , visible: ["PSADMIN", "admin", "teacher", "student", "parent"]},
    { name: 'Base de connaissances', href: '/fitness', visible: ["PSADMIN", "admin", "teacher", "student", "parent"] },
    { name: 'Administration Portail', href: '/admin' , visible: ["PSADMIN", "admin", "teacher", "student", "parent"]},
    { name: 'Aide', href: '/contact' },
    // { name: 'Mot de passe', href: '/contact' },
    // { name: 'Déconnexion', href: '/contact' },
  ]


const Navbar = async () => {
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


  return (

    <div>
         <h1 className='my-10 text-3xl  text-right font font-semibold text-orange-500 mb-1'>PORTAIL TMA HARP</h1> 
         <div className='h-2 w-full p-1 bg-orange-500'>
         </div >
    

    <div className="flex items-center justify-between p-2">
      
        <div className="flex items-center gap-6 justify-end w-full">


            {/* <div>
                <nav className="mx-auto flex max-w-7xl justify-between p-1 lg:px-4">
                        <div className="flex items-center justify-between text-xs font-medium gap-5">
                                {navigation.map((item) => {
                                  
                                   if(item.visible?.includes(role)){
                                    return (
                                    <Link 
                                        key={item.name} 
                                        href={item.href} 
                                        className="capitalize link gap-5 rounded-md px-3 hover:bg-orange-300">
                                        {item.name}
                                    </Link>
                                  );
                                  }
                                })}
                        </div>
                </nav>
            </div> */}
             <div>
                 <nav className="mx-auto flex max-w-7xl justify-between p-1 lg:px-4">
                      <div className="flex items-center justify-between text-xs font-medium gap-5">
                      {optionMenu.map((item)  =>  
                      <div className="flex gap-2 text-sm text-semibold" key={item.display}>
                         <Link href={`${item.href}`}
                                    className="flex items-center justify-center lg:justify-start gap-4 text-semibold px-1 p-2 rounded-xl hover:bg-orange-300"
                              >
                             {/* { item.icone !== "" ? 
                          <Image src={`/ressources/${item.icone}`}alt="" width={20} height={20} className="" /> 
                            : 
                          <Image src={`/ressources/list.png`} alt="" width={20} height={20} className="rounded-full"/>
                          }    */}
                                 {item.menu} 
                              </Link> 
                        </div>
                   )}
                      </div>          
                 </nav>
                 
             </div>

            <div className="flex flex-col text-xs items-center justify-center">
                <Image src="/ressources/avatar.png" alt="" width={30} height={30} className="rounded-full"/>
                 {/* <span className="mt-4 text-sm leading-3 font-medium">Hubert ITOMBA</span> */}
                 {/* <span className="text-[10px] text-gray-500 text-right">Admin</span> */}

                 <DropdownMenu >
                    <DropdownMenuTrigger >Mon compte (<span className="text-[10px] text-gray-500 text-right">{role})</span>)</DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white">
                        {/* <DropdownMenuLabel>Mon compte</DropdownMenuLabel> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem >Mot de passe</DropdownMenuItem>
                        <DropdownMenuItem>Compte Unix :</DropdownMenuItem>
                        <DropdownMenuItem>Dernière connexion :</DropdownMenuItem>
                        < DropdownMenuSeparator />
                        <DropdownMenuItem>Déconnexion</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  
            </div>
                {/* <Image src="/ressources/avatar.png" alt="" width={36} height={36} className="rounded-full"/>
             <UserButton /> */}

        </div>

    </div>

    </div>
  )
}

export default Navbar