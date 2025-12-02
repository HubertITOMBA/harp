"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnvLinkProps {
  href: string;
  icon?: string | null;
  label: string;
  className?: string;
}

export function EnvLink({ href, icon, label, className = "" }: EnvLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Forcer la navigation avec revalidation
    router.push(href);
    router.refresh();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={handleClick}
            className={`flex items-center justify-center xl:justify-start gap-1 md:gap-2 text-xs px-1 md:px-2 py-1 rounded-md hover:bg-orange-300 w-full xl:w-auto ${className}`}
          >
            {icon && icon !== "" && icon !== "N" ? (
              <Image src={`/ressources/${icon}`} alt={label} width={16} height={16} className="flex-shrink-0" />
            ) : (
              <Image src={`/ressources/list.png`} alt={label} width={16} height={16} className="rounded-full flex-shrink-0" />
            )}
            <span className="hidden xl:block text-xs truncate">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="xl:hidden">
          <p className="text-xs font-medium">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

