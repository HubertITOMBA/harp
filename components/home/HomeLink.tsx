"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface HomeLinkProps {
  variant?: "default" | "outline" | "ghost" | "link";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export function HomeLink({ 
  variant = "ghost", 
  className = "",
  showIcon = false,
  showText = true 
}: HomeLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Forcer la navigation avec revalidation
    router.push("/home");
    router.refresh();
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={`flex items-center justify-center lg:justify-start gap-2 text-xs font-medium px-1 p-2 rounded-xl hover:text-orange-500 transition-colors ${className}`}
    >
      {showIcon && <Home className="h-4 w-4" />}
      {showText && <span className="hidden lg:block text-xs">Accueil</span>}
    </Button>
  );
}

