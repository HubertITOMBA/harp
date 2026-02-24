"use client";

import Link from 'next/link';
import Image from 'next/image';
import { role } from '@/lib/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MenuItem {
  menu: string;
  href: string;
  icone: string | null;
}

interface MenuDashItem {
  icon: string;
  label: string;
  href: string;
  visible: string[];
}

interface MenuDashClientProps {
  optionMenu: MenuItem[];
  menuItems: MenuDashItem[];
}

export function MenuDashClient({ optionMenu, menuItems }: MenuDashClientProps) {
  // Menus statiques
  const staticMenus = [
    {
      menu: "Notifications",
      href: "/list/notifications",
      icone: "concierge-bell.png",
    },
    {
      menu: "Mails",
      href: "/list/emails",
      icone: "message.png",
    },
    {
      menu: "Chrono-tâche",
      href: "/list/tasks",
      icone: "history.png",
    },
    {
      menu: "Items",
      href: "/list/items",
      icone: "list.png",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mt-2 md:mt-3 lg:mt-3 xl:mt-4 px-1 md:px-1 lg:px-1 xl:px-2 text-xs">
        {/* Menus statiques */}
        {staticMenus.map((staticMenu) => (
          <div key={staticMenu.menu} className="flex gap-1 md:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  href={staticMenu.href}
                  prefetch={false}
                  className="flex items-center justify-center xl:justify-start gap-1 md:gap-2 text-xs px-1 md:px-2 py-1 md:py-2 rounded-xl hover:bg-orange-300 transition-colors w-full xl:w-auto"
                >
                  {staticMenu.icone && staticMenu.icone !== "" && staticMenu.icone !== "N" ? (
                    <Image src={`/ressources/${staticMenu.icone}`} alt={staticMenu.menu} width={16} height={16} className="flex-shrink-0" />
                  ) : (
                    <Image src={`/ressources/list.png`} alt={staticMenu.menu} width={16} height={16} className="rounded-full flex-shrink-0"/>
                  )}
                  <span className="hidden xl:block text-xs truncate">{staticMenu.menu}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="xl:hidden">
                <p className="text-xs font-medium">{staticMenu.menu}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}

        {optionMenu.map((item) => {
          // Afficher tous les menus sans restriction de rôles
          // Tous les menus sont visibles pour les utilisateurs ayant accès au dashboard (PSADMIN ou PORTAL_ADMIN)
          return (
            <div className="flex gap-1 md:gap-2" key={item.menu}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    href={`${item.href}`}
                    prefetch={false}
                    className="flex items-center justify-center xl:justify-start gap-1 md:gap-2 text-xs px-1 md:px-2 py-1 md:py-2 rounded-xl hover:bg-orange-300 transition-colors w-full xl:w-auto"
                  >
                    {item.icone && item.icone !== "" && item.icone !== "N" ? (
                      <Image src={`/ressources/${item.icone}`} alt={item.menu} width={16} height={16} className="flex-shrink-0" />
                    ) : (
                      <Image src={`/ressources/list.png`} alt={item.menu} width={16} height={16} className="rounded-full flex-shrink-0"/>
                    )}
                    <span className="hidden xl:block text-xs truncate">{item.menu}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="xl:hidden">
                  <p className="text-xs font-medium">{item.menu}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })} 

        <div className="mt-6 md:mt-8 lg:mt-10 flex flex-col gap-1 md:gap-2">
          {menuItems.map(item =>{ 
            if(item.visible.includes(role)){
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Link 
                      href={item.href}
                      prefetch={false}
                      className="flex text-xs justify-center xl:justify-start gap-1 md:gap-2 rounded-md hover:text-orange-500 transition-colors"
                    >
                      <Image src={item.icon} alt={item.label} width={16} height={16} className="flex-shrink-0" />  
                      <span className="hidden xl:block text-xs truncate">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="xl:hidden">
                    <p className="text-xs font-medium">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

