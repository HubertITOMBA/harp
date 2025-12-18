"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateMessageSchema = z.object({
  msg: z.string().min(1, "Le message est requis").max(255, "Le message ne peut pas dépasser 255 caractères"),
  fromdate: z.string().min(1, "La date de début est requise"),
  todate: z.string().min(1, "La date de fin est requise"),
  statut: z.enum(["ACTIF", "INACTIF"], {
    errorMap: () => ({ message: "Le statut doit être ACTIF ou INACTIF" }),
  }),
}).refine(
  (data) => {
    const fromDate = new Date(data.fromdate);
    const toDate = new Date(data.todate);
    return toDate >= fromDate;
  },
  {
    message: "La date de fin doit être supérieure ou égale à la date de début",
    path: ["todate"],
  }
);

const UpdateMessageSchema = z.object({
  num: z.number(),
  msg: z.string().min(1, "Le message est requis").max(255, "Le message ne peut pas dépasser 255 caractères"),
  fromdate: z.string().min(1, "La date de début est requise"),
  todate: z.string().min(1, "La date de fin est requise"),
  statut: z.enum(["ACTIF", "INACTIF"], {
    errorMap: () => ({ message: "Le statut doit être ACTIF ou INACTIF" }),
  }),
}).refine(
  (data) => {
    const fromDate = new Date(data.fromdate);
    const toDate = new Date(data.todate);
    return toDate >= fromDate;
  },
  {
    message: "La date de fin doit être supérieure ou égale à la date de début",
    path: ["todate"],
  }
);

/**
 * Récupère le message actif depuis la table psadm_info
 * Un message est considéré comme actif si :
 * - Le statut est "ACTIF"
 * - La date actuelle est entre fromdate et todate
 * 
 * @returns Le message actif ou null s'il n'y en a pas
 */
export async function getActiveMessage() {
  try {
    const now = new Date();
    
    const activeMessage = await db.psadm_info.findFirst({
      where: {
        statut: "ACTIF",
        fromdate: {
          lte: now,
        },
        todate: {
          gte: now,
        },
      },
      orderBy: {
        fromdate: "desc", // Prendre le message le plus récent si plusieurs sont actifs
      },
    });

    return activeMessage;
  } catch (error) {
    console.error("Erreur lors de la récupération du message actif:", error);
    return null;
  }
}

/**
 * Récupère tous les messages actifs depuis la table psadm_info
 * Un message est considéré comme actif si :
 * - Le statut est "ACTIF" (si le champ existe)
 * - La date actuelle est entre fromdate et todate
 * 
 * @returns Un tableau de messages actifs, triés par date de début (plus récent en premier)
 */
export async function getAllActiveMessages() {
  try {
    const now = new Date();
    
    // Essayer d'abord avec le filtre statut
    try {
      const activeMessages = await db.psadm_info.findMany({
        where: {
          statut: "ACTIF",
          fromdate: {
            lte: now,
          },
          todate: {
            gte: now,
          },
        },
        orderBy: {
          fromdate: "desc", // Plus récent en premier
        },
      });

      return activeMessages;
    } catch (statutError: any) {
      // Si le champ statut n'existe pas encore (erreur Prisma ou SQL), récupérer sans ce filtre
      const errorMessage = statutError?.message || "";
      const errorCode = statutError?.code || "";
      
      if (
        errorMessage.includes('statut') || 
        errorMessage.includes('Unknown column') ||
        errorCode === 'P2009' ||
        errorCode === 'P2011'
      ) {
        console.log("Le champ statut n'existe pas encore, récupération sans filtre statut");
        const activeMessages = await db.psadm_info.findMany({
          where: {
            fromdate: {
              lte: now,
            },
            todate: {
              gte: now,
            },
          },
          orderBy: {
            fromdate: "desc",
          },
        });
        return activeMessages;
      }
      // Si c'est une autre erreur, la propager
      throw statutError;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des messages actifs:", error);
    return [];
  }
}

/**
 * Récupère tous les messages
 * 
 * @returns Un tableau de messages avec leurs informations
 */
export async function getAllMessages() {
  try {
    const messages = await db.psadm_info.findMany({
      orderBy: {
        fromdate: "desc",
      },
    });

    return messages;
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    return [];
  }
}

/**
 * Récupère un message par son identifiant
 * 
 * @param num - L'identifiant numérique du message à récupérer
 * @returns Le message trouvé ou null s'il n'existe pas
 */
export async function getMessageById(num: number) {
  try {
    const message = await db.psadm_info.findUnique({
      where: { num },
    });

    return message;
  } catch (error) {
    console.error("Erreur lors de la récupération du message:", error);
    return null;
  }
}

/**
 * Crée un nouveau message dans la base de données
 * 
 * @param formData - Les données du formulaire contenant les champs du message
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec, et num (number) du message créé
 */
export async function createMessage(formData: FormData) {
  try {
    const rawData = {
      msg: formData.get("msg") as string,
      fromdate: formData.get("fromdate") as string,
      todate: formData.get("todate") as string,
      statut: formData.get("statut") as string,
    };

    const validatedData = CreateMessageSchema.parse(rawData);

    // Créer le message
    const newMessage = await db.psadm_info.create({
      data: {
        msg: validatedData.msg,
        fromdate: new Date(validatedData.fromdate),
        todate: new Date(validatedData.todate),
        statut: validatedData.statut,
      },
    });

    return { 
      success: true, 
      message: `Message créé avec succès`,
      num: newMessage.num 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la création du message" };
  } finally {
    revalidatePath("/list/messages");
  }
}

/**
 * Met à jour un message existant
 * 
 * @param formData - Les données du formulaire contenant le num et les nouveaux champs
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function updateMessage(formData: FormData) {
  try {
    const rawData = {
      num: parseInt(formData.get("num") as string, 10),
      msg: formData.get("msg") as string,
      fromdate: formData.get("fromdate") as string,
      todate: formData.get("todate") as string,
      statut: formData.get("statut") as string,
    };

    const validatedData = UpdateMessageSchema.parse(rawData);

    // Vérifier que le message existe
    const existing = await db.psadm_info.findUnique({
      where: { num: validatedData.num },
    });

    if (!existing) {
      return { success: false, error: "Message non trouvé" };
    }

    // Mettre à jour le message
    await db.psadm_info.update({
      where: { num: validatedData.num },
      data: {
        msg: validatedData.msg,
        fromdate: new Date(validatedData.fromdate),
        todate: new Date(validatedData.todate),
        statut: validatedData.statut,
      },
    });

    return { 
      success: true, 
      message: `Message modifié avec succès`
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la modification du message" };
  } finally {
    revalidatePath("/list/messages");
  }
}

/**
 * Supprime un message
 * 
 * @param num - L'identifiant numérique du message à supprimer
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function deleteMessage(num: number) {
  try {
    // Vérifier que le message existe
    const existing = await db.psadm_info.findUnique({
      where: { num },
    });

    if (!existing) {
      return { success: false, error: "Message non trouvé" };
    }

    // Supprimer le message
    await db.psadm_info.delete({
      where: { num },
    });

    return { 
      success: true, 
      message: `Message supprimé avec succès`
    };
  } catch (error) {
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression du message" };
  } finally {
    revalidatePath("/list/messages");
  }
}

