"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";

interface MenuItem {
  id: number;
  menu: string;
  href: string | null;
  icone: string | null;
  display: number;
}

interface NavbarMobileMenuProps {
  menuItems: MenuItem[];
}

export function NavbarMobileMenu({ menuItems }: NavbarMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden flex-shrink-0">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white hover:bg-gray-100"
          >
            <Menu className="h-4 w-4" />
            <span className="text-sm font-medium">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-[80vh] overflow-y-auto z-[1000]">
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.id} asChild>
              <Link
                href={item.href || "#"}
                className="flex items-center gap-3 w-full cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                {item.icone && item.icone !== "" && item.icone !== "N" ? (
                  <Image
                    src={`/ressources/${item.icone}`}
                    alt=""
                    width={16}
                    height={16}
                    className="flex-shrink-0"
                  />
                ) : null}
                <span className="text-xs">{item.menu}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

