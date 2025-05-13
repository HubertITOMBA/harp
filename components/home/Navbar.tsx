import Image from "next/image";
import { ThemeToggle } from '../ThemeToggle'
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
import { logOut } from "@/actions/logout";

interface RoleMenuProps {
  DroitsUser : string ;
}; 


const Navbar = async ({ DroitsUser }: RoleMenuProps) => {
   

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
    <nav className="backdrop-blur-lg sticky top-0 z-[999]">
         <h1 className='my-10 text-3xl  text-right font font-semibold text-orange-500 mb-1'>TMA HARP</h1> 
         <div className='h-2 w-full p-1 bg-orange-500'>
         </div >
    

    <div className="flex items-center justify-between p-2">
      
        <div className="flex items-center gap-5 justify-end w-full">


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
                      <div className="flex gap-2 text-xl text-bold" key={item.display}>
                         <Link href={`${item.href}`}
                                    className="flex items-center justify-center lg:justify-start gap-4 text-semibold px-1 p-2 rounded-xl hover:text-orange-500 transition-colors"
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

             <ThemeToggle />
             <UserButton />


            {/* <div className="flex flex-col text-xs items-center justify-center">
                <Image src="/ressources/avatar.png" alt="" width={30} height={30} className="rounded-full"/>
                 <DropdownMenu >
                    <DropdownMenuTrigger >Mon compte (<span className="text-[10px] text-gray-500 text-right">{role})</span>)</DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem ><Link href="/reset">Mot de passe</Link> </DropdownMenuItem>
                        <DropdownMenuItem>Compte Unix :</DropdownMenuItem>
                        <DropdownMenuItem>Dernière connexion :</DropdownMenuItem>
                        < DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <form action={async () => {
                              "use server";
                              await logOut();
                            }}
                            > 
                             <button type="submit"> 
                              Déconnexion
                              </button>
                            </form>
                         </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
                  
            </div> */}
          

        </div>

    </div>

    </nav>
  )
}

export default Navbar