"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
import { getUserNotifications, markNotificationAsRead } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { ViewNotificationDialog } from './ViewNotificationDialog';

export function UserNotificationsList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

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

  const handleMarkAsRead = async (notificationId: number) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
      // Recharger les notifications
      const data = await getUserNotifications();
      setNotifications(data);
    } else {
      toast.error(result.error || "Erreur lors du marquage de la notification");
    }
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
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="notifications" className="shadow-xl border-0 bg-white/80 backdrop-blur-sm scroll-mt-20">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              Mes Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-red-500 text-white">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-orange-100">
              {notifications.length} notification{notifications.length > 1 ? "s" : ""} reçue{notifications.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {notifications.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Aucune notification</p>
            <p className="text-sm">Vous n'avez pas encore reçu de notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isUnread = notification.recipients && notification.recipients.some((r: any) => !r.read);
              const readRecipients = notification.recipients?.filter((r: any) => r.read).length || 0;
              const totalRecipients = notification.recipients?.length || 0;

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isUnread
                      ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isUnread ? (
                          <XCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                        <h3 className={`font-semibold text-sm sm:text-base ${isUnread ? "text-orange-900" : "text-gray-700"}`}>
                          {notification.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Par {notification.creator?.name || notification.creator?.netid || notification.creator?.email || "Inconnu"}
                        </span>
                        <span>
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(notification.createdAt))}
                        </span>
                        {totalRecipients > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {readRecipients}/{totalRecipients} lu{readRecipients > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNotificationId(notification.id)}
                        className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-50"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isUnread && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                        >
                          Marquer comme lue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {selectedNotificationId && (
        <ViewNotificationDialog
          notificationId={selectedNotificationId}
          open={selectedNotificationId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedNotificationId(null);
              // Recharger les notifications après fermeture
              getUserNotifications().then(setNotifications);
            }
          }}
        />
      )}
    </Card>
  );
}

