"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getUserNotifications } from '@/lib/actions/notification-actions';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notifications = await getUserNotifications();
        const unread = notifications.filter(n => 
          n.recipients && n.recipients.some((r: any) => !r.read)
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
    
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Écouter les événements de revalidation
  useEffect(() => {
    const handleFocus = () => {
      getUserNotifications().then(notifications => {
        const unread = notifications.filter(n => 
          n.recipients && n.recipients.some((r: any) => !r.read)
        ).length;
        setUnreadCount(unread);
      });
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

