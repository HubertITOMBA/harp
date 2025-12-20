"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Shield, Bell, Home, CheckSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileSidebarProps {}

/**
 * Menu latéral spécifique pour la page de profil utilisateur
 */
export function ProfileSidebar({}: ProfileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      id: 'profile',
      label: 'Mon profil',
      icon: User,
      href: '/user/profile',
    },
    {
      id: 'roles',
      label: 'Mes rôles',
      icon: Shield,
      href: '/user/profile/roles',
    },
    {
      id: 'tasks',
      label: 'Mes tâches',
      icon: CheckSquare,
      href: '/user/profile/tasks',
    },
    {
      id: 'notifications',
      label: 'Mes notifications',
      icon: Bell,
      href: '/user/profile/notifications',
    },
  ];

  return (
    <nav className="mt-6 space-y-2">
      {/* Lien retour à l'accueil */}
      <Link href="/home">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start xl:justify-start gap-3 h-10 text-sm font-medium transition-colors",
            "hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline">Accueil</span>
        </Button>
      </Link>

      {/* Séparateur */}
      <div className="border-t border-gray-200 my-4" />

      {/* Menu items */}
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.id} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start xl:justify-start gap-3 h-10 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
                  : "hover:bg-orange-50 hover:text-orange-700"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden xl:inline">{item.label}</span>
            </Button>
          </Link>
        );
      })}

      {/* Séparateur */}
      <div className="border-t border-gray-200 my-4" />

      {/* Bouton Retour à l'accueil */}
      <Link href="/home">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start xl:justify-start gap-3 h-10 text-sm font-medium transition-colors",
            "hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline">Retour à l'accueil</span>
        </Button>
      </Link>
    </nav>
  );
}

