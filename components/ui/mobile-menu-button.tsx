"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuButtonProps {
  children: React.ReactNode;
}

export function MobileMenuButton({ children }: MobileMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-[1000] bg-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar mobile */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-[1000] transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 pt-16 md:pt-4">
          {children}
        </div>
      </div>
    </>
  );
}

