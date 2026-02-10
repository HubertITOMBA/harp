"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getUserNotifications } from '@/lib/actions/notification-actions';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const errorLoggedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function loadNotifications() {
      try {
        const notifications = await getUserNotifications();
        consecutiveErrorsRef.current = 0;
        const unread = notifications.filter(n =>
          n.recipients && n.recipients.some((r: unknown) => (r as { read?: boolean }).read === false)
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        setUnreadCount(0);
        consecutiveErrorsRef.current += 1;
        // Ne loguer qu'une fois pour éviter de spammer la console (ex. en prod si Server Action renvoie une redirection)
        if (!errorLoggedRef.current) {
          errorLoggedRef.current = true;
          console.warn("Notifications indisponibles (session ou réseau):", error instanceof Error ? error.message : error);
        }
        // Après 2 échecs consécutifs, arrêter le polling (évite "unexpected response" en boucle)
        if (consecutiveErrorsRef.current >= 2 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();

    // Recharger toutes les 30 secondes (tant que pas d'échecs répétés)
    intervalId = setInterval(loadNotifications, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Recharger au retour sur l'onglet (et réinitialiser le compteur d'erreurs pour réessayer le polling)
  useEffect(() => {
    const handleFocus = () => {
      errorLoggedRef.current = false;
      consecutiveErrorsRef.current = 0;
      getUserNotifications()
        .then(notifications => {
          const unread = notifications.filter(n =>
            n.recipients && n.recipients.some((r: unknown) => (r as { read?: boolean }).read === false)
          ).length;
          setUnreadCount(unread);
        })
        .catch(() => setUnreadCount(0));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (loading) {
    return null;
  }

  return (
      <Link href="/user/profile/notifications">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 hover:bg-orange-50"
        title="Mes notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] font-bold border-2 border-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}

