"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`flex items-center justify-center lg:justify-start gap-2 text-xs px-2 py-1 rounded-md hover:bg-orange-300 ${className}`}
    >
      {icon && icon !== "" && icon !== "N" ? (
        <Image src={`/ressources/${icon}`} alt="" width={16} height={16} className="" />
      ) : (
        <Image src={`/ressources/list.png`} alt="" width={16} height={16} className="rounded-full" />
      )}
      <span className="hidden lg:block text-xs">{label}</span>
    </Button>
  );
}

