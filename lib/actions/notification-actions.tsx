"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendMail } from "@/lib/mail";

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

    // Récupérer les emails des destinataires pour l'envoi d'emails
    const recipientEmails: Array<{ email: string; name: string }> = [];
    
    // Récupérer les emails des utilisateurs sélectionnés
    if (validatedData.userIds.length > 0) {
      const users = await db.user.findMany({
        where: {
          id: { in: validatedData.userIds.map(id => parseInt(id, 10)) },
          email: { not: null },
        },
        select: {
          email: true,
          name: true,
          netid: true,
        },
      });
      
      users.forEach(user => {
        if (user.email) {
          recipientEmails.push({
            email: user.email,
            name: user.name || user.netid || 'Utilisateur',
          });
        }
      });
    }
    
    // Récupérer les emails des utilisateurs ayant les rôles sélectionnés
    if (validatedData.roleIds.length > 0) {
      const roleIds = validatedData.roleIds.map(id => parseInt(id, 10));
      
      // Récupérer les utilisateurs ayant ces rôles via harpuseroles
      const usersWithRoles = await db.harpuseroles.findMany({
        where: {
          roleId: { in: roleIds },
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              netid: true,
            },
          },
        },
      });
      
      usersWithRoles.forEach(userRole => {
        if (userRole.user?.email) {
          // Éviter les doublons
          const emailExists = recipientEmails.some(e => e.email === userRole.user.email);
          if (!emailExists) {
            recipientEmails.push({
              email: userRole.user.email,
              name: userRole.user.name || userRole.user.netid || 'Utilisateur',
            });
          }
        }
      });
    }

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

    // Envoyer les emails aux destinataires qui ont une adresse email
    const emailResults: Array<{ email: string; success: boolean }> = [];
    
    if (recipientEmails.length > 0) {
      const emailPromises = recipientEmails.map(async (recipient) => {
        const result = await sendMail({
          to: recipient.email,
          subject: `[Portail HARP] ${validatedData.title}`,
          html: `
            <h2>${validatedData.title}</h2>
            <div style="margin-top: 20px;">
              ${validatedData.message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              Cette notification a été envoyée depuis le Portail HARP.
            </p>
          `,
          text: `${validatedData.title}\n\n${validatedData.message}`,
        });
        
        return { email: recipient.email, success: result.success };
      });
      
      emailResults.push(...await Promise.all(emailPromises));
    }

    const emailsSent = emailResults.filter(r => r.success).length;
    const emailsFailed = emailResults.filter(r => !r.success).length;
    
    let message = `La notification a été créée avec succès`;
    if (emailsSent > 0) {
      message += ` et ${emailsSent} email${emailsSent > 1 ? 's ont' : ' a'} été envoyé${emailsSent > 1 ? 's' : ''}`;
    }
    if (emailsFailed > 0) {
      message += `. ${emailsFailed} email${emailsFailed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyé${emailsFailed > 1 ? 's' : ''}`;
    }

    return { 
      success: true, 
      message,
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

const SendEmailSchema = z.object({
  subject: z.string().min(1, "Le sujet est requis").max(255, "Le sujet ne peut pas dépasser 255 caractères"),
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
 * Envoie un email directement à des utilisateurs ou des rôles sans créer de notification
 * 
 * @param formData - Les données du formulaire contenant le sujet, le message et les destinataires
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function sendEmail(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour envoyer un email" };
    }

    const rawData = {
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      userIds: formData.getAll("userIds").map(id => id as string).filter(Boolean),
      roleIds: formData.getAll("roleIds").map(id => id as string).filter(Boolean),
    };

    const validatedData = SendEmailSchema.parse(rawData);

    // Récupérer les emails des destinataires avec leurs informations
    const recipientEmails: Array<{ 
      email: string; 
      name: string; 
      recipientType: "USER" | "ROLE";
      recipientId: number;
    }> = [];
    
    // Récupérer les emails des utilisateurs sélectionnés
    if (validatedData.userIds.length > 0) {
      const users = await db.user.findMany({
        where: {
          id: { in: validatedData.userIds.map(id => parseInt(id, 10)) },
          email: { not: null },
        },
        select: {
          id: true,
          email: true,
          name: true,
          netid: true,
        },
      });
      
      users.forEach(user => {
        if (user.email) {
          recipientEmails.push({
            email: user.email,
            name: user.name || user.netid || 'Utilisateur',
            recipientType: "USER",
            recipientId: user.id,
          });
        }
      });
    }
    
    // Récupérer les emails des utilisateurs ayant les rôles sélectionnés
    if (validatedData.roleIds.length > 0) {
      const roleIds = validatedData.roleIds.map(id => parseInt(id, 10));
      
      const usersWithRoles = await db.harpuseroles.findMany({
        where: {
          roleId: { in: roleIds },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              netid: true,
            },
          },
          harproles: {
            select: {
              id: true,
            },
          },
        },
      });
      
      usersWithRoles.forEach(userRole => {
        if (userRole.user?.email) {
          const emailExists = recipientEmails.some(e => e.email === userRole.user.email);
          if (!emailExists) {
            recipientEmails.push({
              email: userRole.user.email,
              name: userRole.user.name || userRole.user.netid || 'Utilisateur',
              recipientType: "ROLE",
              recipientId: userRole.harproles.id,
            });
          }
        }
      });
    }

    // Vérifier qu'il y a au moins un destinataire avec email
    if (recipientEmails.length === 0) {
      return { 
        success: false, 
        error: "Aucun destinataire avec une adresse email valide trouvé" 
      };
    }

    const senderId = parseInt(session.user.id, 10);

    // Créer l'enregistrement de l'email envoyé
    const sentEmail = await db.harpsentemail.create({
      data: {
        subject: validatedData.subject,
        message: validatedData.message,
        sentBy: senderId,
        recipients: {
          create: recipientEmails.map(recipient => ({
            recipientType: recipient.recipientType,
            recipientId: recipient.recipientId,
            email: recipient.email,
            name: recipient.name,
            sent: false, // Sera mis à jour après l'envoi
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    // Envoyer les emails
    const emailResults: Array<{ 
      email: string; 
      success: boolean; 
      error?: string;
      recipientId: number;
    }> = [];
    
    const emailPromises = recipientEmails.map(async (recipient) => {
      const result = await sendMail({
        to: recipient.email,
        subject: `[Portail HARP] ${validatedData.subject}`,
        html: `
          <h2>${validatedData.subject}</h2>
          <div style="margin-top: 20px;">
            ${validatedData.message.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Cet email a été envoyé depuis le Portail HARP.
          </p>
        `,
        text: `${validatedData.subject}\n\n${validatedData.message}`,
      });
      
      // Trouver le recipient correspondant dans la base
      const dbRecipient = sentEmail.recipients.find(
        r => r.email === recipient.email && 
             r.recipientType === recipient.recipientType && 
             r.recipientId === recipient.recipientId
      );
      
      // Mettre à jour le statut d'envoi
      if (dbRecipient) {
        await db.harpsentemailrecipient.update({
          where: { id: dbRecipient.id },
          data: {
            sent: result.success,
            sentAt: result.success ? new Date() : null,
            error: result.success ? null : (result.error || "Erreur inconnue"),
          },
        });
      }
      
      return { 
        email: recipient.email, 
        success: result.success,
        error: result.error,
        recipientId: dbRecipient?.id || 0,
      };
    });
    
    emailResults.push(...await Promise.all(emailPromises));

    const emailsSent = emailResults.filter(r => r.success).length;
    const emailsFailed = emailResults.filter(r => !r.success).length;
    
    let message = `${emailsSent} email${emailsSent > 1 ? 's ont' : ' a'} été envoyé${emailsSent > 1 ? 's' : ''} avec succès`;
    if (emailsFailed > 0) {
      message += `. ${emailsFailed} email${emailsFailed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyé${emailsFailed > 1 ? 's' : ''}`;
    }

    revalidatePath("/list/emails");

    return { 
      success: emailsSent > 0, 
      message: emailsSent > 0 ? message : "Aucun email n'a pu être envoyé"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur lors de l'envoi de l'email:", error);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}

/**
 * Récupère tous les emails envoyés (pour l'administration)
 * 
 * @returns Un tableau de tous les emails envoyés avec leurs détails
 */
export async function getAllSentEmails() {
  try {
    const sentEmails = await db.harpsentemail.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            netid: true,
          },
        },
        recipients: {
          orderBy: {
            sentAt: 'desc',
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return sentEmails;
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les emails envoyés:", error);
    return [];
  }
}

/**
 * Récupère un email envoyé par son ID
 * 
 * @param id - L'ID de l'email à récupérer
 * @returns L'email trouvé ou null si il n'existe pas
 */
export async function getSentEmailById(id: number) {
  try {
    const sentEmail = await db.harpsentemail.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            netid: true,
          },
        },
        recipients: {
          orderBy: {
            sentAt: 'desc',
          },
        },
      },
    });

    return sentEmail;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'email:", error);
    return null;
  }
}
