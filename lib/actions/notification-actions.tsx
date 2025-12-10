"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateNotificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Le titre ne peut pas dépasser 255 caractères"),
  message: z.string().min(1, "Le message est requis"),
  userIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
}).refine(
  (data) => (data.userIds && data.userIds.length > 0) || (data.roleIds && data.roleIds.length > 0),
  {
    message: "Vous devez sélectionner au moins un utilisateur ou un rôle",
  }
);

const UpdateNotificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Le titre ne peut pas dépasser 255 caractères"),
  message: z.string().min(1, "Le message est requis"),
  userIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
}).refine(
  (data) => (data.userIds && data.userIds.length > 0) || (data.roleIds && data.roleIds.length > 0),
  {
    message: "Vous devez sélectionner au moins un utilisateur ou un rôle",
  }
);

/**
 * Récupère tous les utilisateurs pour la sélection dans les notifications
 * 
 * @returns Un tableau d'utilisateurs avec id, name, email et netid
 */
export async function getAllUsersForNotifications() {
  try {
    const users = await db.user.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        netid: true,
      },
    });

    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
}

/**
 * Récupère tous les rôles HARP pour la sélection dans les notifications
 * 
 * @returns Un tableau de rôles avec id, role et descr
 */
export async function getAllRolesForNotifications() {
  try {
    const roles = await db.harproles.findMany({
      orderBy: {
        role: 'asc',
      },
      select: {
        id: true,
        role: true,
        descr: true,
      },
    });

    return roles;
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return [];
  }
}

/**
 * Crée une nouvelle notification et l'envoie aux destinataires sélectionnés
 * 
 * @param formData - Les données du formulaire contenant le titre, le message et les destinataires
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec, et id (number) de la notification créée
 */
export async function createNotification(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour créer une notification" };
    }

    const createdBy = parseInt(session.user.id, 10);
    
    if (isNaN(createdBy) || createdBy <= 0) {
      return { success: false, error: "ID utilisateur invalide" };
    }

    const rawData = {
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      userIds: formData.getAll("userIds").map(id => id as string).filter(Boolean),
      roleIds: formData.getAll("roleIds").map(id => id as string).filter(Boolean),
    };

    const validatedData = CreateNotificationSchema.parse(rawData);

    // Créer la notification
    const notification = await db.harpnotification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        createdBy: createdBy,
        recipients: {
          create: [
            // Ajouter les utilisateurs comme destinataires
            ...validatedData.userIds.map(userId => ({
              recipientType: "USER",
              recipientId: parseInt(userId, 10),
              read: false,
            })),
            // Ajouter les rôles comme destinataires
            ...validatedData.roleIds.map(roleId => ({
              recipientType: "ROLE",
              recipientId: parseInt(roleId, 10),
              read: false,
            })),
          ],
        },
      },
    });

    return { 
      success: true, 
      message: `La notification a été créée et envoyée avec succès`,
      id: notification.id 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur lors de la création de la notification:", error);
    return { success: false, error: "Erreur lors de la création de la notification" };
  } finally {
    revalidatePath("/list/notifications");
    revalidatePath("/user/profile");
  }
}

/**
 * Met à jour une notification existante
 * 
 * @param notificationId - L'ID de la notification à mettre à jour
 * @param formData - Les données du formulaire contenant le titre, le message et les destinataires
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function updateNotification(notificationId: number, formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour modifier une notification" };
    }

    const rawData = {
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      userIds: formData.getAll("userIds").map(id => id as string).filter(Boolean),
      roleIds: formData.getAll("roleIds").map(id => id as string).filter(Boolean),
    };

    const validatedData = UpdateNotificationSchema.parse(rawData);

    // Vérifier si la notification existe
    const existingNotification = await db.harpnotification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      return { success: false, error: "Notification non trouvée" };
    }

    // Supprimer les anciens destinataires et créer les nouveaux
    await db.harpnotificationrecipient.deleteMany({
      where: { notificationId: notificationId },
    });

    // Mettre à jour la notification et créer les nouveaux destinataires
    await db.harpnotification.update({
      where: { id: notificationId },
      data: {
        title: validatedData.title,
        message: validatedData.message,
        recipients: {
          create: [
            ...validatedData.userIds.map(userId => ({
              recipientType: "USER",
              recipientId: parseInt(userId, 10),
              read: false,
            })),
            ...validatedData.roleIds.map(roleId => ({
              recipientType: "ROLE",
              recipientId: parseInt(roleId, 10),
              read: false,
            })),
          ],
        },
      },
    });

    return { 
      success: true, 
      message: `La notification a été mise à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la notification" };
  } finally {
    revalidatePath("/list/notifications");
    revalidatePath("/user/profile");
  }
}

/**
 * Marque une notification comme lue pour l'utilisateur actuel
 * 
 * @param notificationId - L'ID de la notification à marquer comme lue
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return { success: false, error: "ID utilisateur invalide" };
    }

    // Récupérer les rôles de l'utilisateur
    const userRoles = await db.harpuseroles.findMany({
      where: { userId: userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map(ur => ur.roleId);

    // Marquer comme lue pour l'utilisateur directement
    await db.harpnotificationrecipient.updateMany({
      where: {
        notificationId: notificationId,
        recipientType: "USER",
        recipientId: userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    // Marquer comme lue pour les rôles de l'utilisateur
    if (roleIds.length > 0) {
      await db.harpnotificationrecipient.updateMany({
        where: {
          notificationId: notificationId,
          recipientType: "ROLE",
          recipientId: { in: roleIds },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    }

    return { 
      success: true, 
      message: "Notification marquée comme lue" 
    };
  } catch (error) {
    console.error("Erreur lors du marquage de la notification comme lue:", error);
    return { success: false, error: "Erreur lors du marquage de la notification comme lue" };
  } finally {
    revalidatePath("/user/profile");
    revalidatePath("/list/notifications");
  }
}

/**
 * Récupère toutes les notifications de l'utilisateur actuel
 * 
 * @returns Un tableau de notifications avec leurs détails
 */
export async function getUserNotifications() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return [];
    }

    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return [];
    }

    // Récupérer les rôles de l'utilisateur
    const userRoles = await db.harpuseroles.findMany({
      where: { userId: userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map(ur => ur.roleId);

    // Récupérer les notifications où l'utilisateur est destinataire directement ou via ses rôles
    const notifications = await db.harpnotification.findMany({
      where: {
        OR: [
          {
            recipients: {
              some: {
                recipientType: "USER",
                recipientId: userId,
              },
            },
          },
          ...(roleIds.length > 0 ? [{
            recipients: {
              some: {
                recipientType: "ROLE",
                recipientId: { in: roleIds },
              },
            },
          }] : []),
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            netid: true,
          },
        },
        recipients: {
          where: {
            OR: [
              {
                recipientType: "USER",
                recipientId: userId,
              },
              ...(roleIds.length > 0 ? [{
                recipientType: "ROLE",
                recipientId: { in: roleIds },
              }] : []),
            ],
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return [];
  }
}

/**
 * Récupère toutes les notifications (pour l'administration)
 * 
 * @returns Un tableau de toutes les notifications avec leurs détails
 */
export async function getAllNotifications() {
  try {
    const notifications = await db.harpnotification.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            netid: true,
          },
        },
        recipients: {
          include: {
            notification: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les notifications:", error);
    return [];
  }
}

/**
 * Récupère une notification par son ID
 * 
 * @param id - L'ID de la notification à récupérer
 * @returns La notification trouvée ou null si elle n'existe pas
 */
export async function getNotificationById(id: number) {
  try {
    const notification = await db.harpnotification.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            netid: true,
          },
        },
        recipients: true,
      },
    });

    return notification;
  } catch (error) {
    console.error("Erreur lors de la récupération de la notification:", error);
    return null;
  }
}
