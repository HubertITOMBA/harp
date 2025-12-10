"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2 } from "lucide-react";
import { getUserNotifications } from '@/lib/actions/notification-actions';
import { UserNotificationsDataTable } from './user-notifications-data-table';
import { columns, type UserNotification } from './user-notifications-columns';

/**
 * Tableau des notifications de l'utilisateur avec tri, recherche et filtres
 */
export function UserNotificationsTable() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const data = await getUserNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const handleMarkAsRead = () => {
    // Recharger les notifications après marquage comme lue
    getUserNotifications().then((data) => {
      setNotifications(data);
    });
  };

  const unreadCount = notifications.filter(n => 
    n.recipients && n.recipients.some((r: any) => !r.read)
  ).length;

  if (loading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Mes Notifications</CardTitle>
              <CardDescription className="text-orange-100">
                Chargement...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                Mes Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-orange-100 text-xs">
                {notifications.length} notification{notifications.length > 1 ? "s" : ""} reçue{notifications.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
        {notifications.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium mb-1">Aucune notification</p>
            <p className="text-xs">Vous n'avez pas encore reçu de notifications.</p>
          </div>
        ) : (
          <UserNotificationsDataTable 
            columns={columns} 
            data={notifications}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
      </CardContent>
    </Card>
  );
}
