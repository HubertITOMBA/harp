"use server";

import { auth } from "@/auth";
import { sendMail } from "@/lib/mail";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const SendTaskEmailSchema = z.object({
  subject: z.string().min(1, "Le sujet est requis"),
  message: z.string().min(1, "Le message est requis"),
  exportType: z.enum(["excel", "pdf"]),
  taskId: z.string().min(1, "L'ID de la tâche est requis"),
  userIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
});

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes) return "N/A";
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatElapsedTime = (startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string => {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}min`;
};

// Fonction pour calculer trigNetid (3 premiers caractères de resourceNetid en majuscules)
const getTrigNetid = (resourceNetid: string | null | undefined): string => {
  if (!resourceNetid) return "";
  return resourceNetid.substring(0, 3).toUpperCase();
};

/**
 * Génère un fichier Excel en mémoire pour une chrono-tâche
 */
async function generateExcelBuffer(task: any): Promise<Buffer> {
  // Préparer les données des items pour Excel
  const itemsData = (task.items || []).map((item: any) => ({
    "Ordre": item.order,
    "Tâches": item.harpitem?.descr || item.title || "N/A",
    "Trig Netid": getTrigNetid(item.resourceNetid) || "N/A",
    "Date début": item.startDate ? formatDateTime(item.startDate) : "N/A",
    "Date fin": item.endDate ? formatDateTime(item.endDate) : "N/A",
    "Temps écoulé": formatElapsedTime(item.startDate, item.endDate),
    "Ressource": item.resourceNetid || "N/A",
    "Statut": statusLabels[item.status] || item.status,
    "Prédécesseur": item.predecessor?.title || item.predecessor?.harpitem?.descr || "Aucun",
    "Commentaire": item.comment || "",
  }));

  // Utiliser xlsx pour créer le buffer
  const worksheet = XLSX.utils.json_to_sheet(itemsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chrono-tâche");
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
}

/**
 * Génère un fichier PDF en mémoire pour une chrono-tâche
 */
async function generatePDFBuffer(task: any): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const orangeColor = [255, 140, 0];
  const grayColor = [128, 128, 128];
  
  // En-tête avec fond orange
  doc.setFillColor(...orangeColor);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Chrono-tâche", 14, 20);
  
  // Informations de la tâche
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let yPos = 40;
  
  doc.setFont("helvetica", "bold");
  doc.text("Titre:", 14, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(task.title, 50, yPos);
  yPos += 7;
  
  doc.setFont("helvetica", "bold");
  doc.text("ID:", 14, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(task.id.toString(), 50, yPos);
  yPos += 7;
  
  doc.setFont("helvetica", "bold");
  doc.text("Statut:", 14, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(statusLabels[task.status] || task.status, 50, yPos);
  yPos += 7;
  
  if (task.date) {
    doc.setFont("helvetica", "bold");
    doc.text("Date prévue:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(task.date), 50, yPos);
    yPos += 7;
  }
  
  if (task.estimatedDuration) {
    doc.setFont("helvetica", "bold");
    doc.text("Durée estimée:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatDuration(task.estimatedDuration), 50, yPos);
    yPos += 7;
  }
  
  if (task.effectiveDuration !== null && task.effectiveDuration !== undefined) {
    doc.setFont("helvetica", "bold");
    doc.text("Durée effective:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatDuration(task.effectiveDuration), 50, yPos);
    yPos += 7;
  }
  
  if (task.descr) {
    yPos += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 14, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    const descrLines = doc.splitTextToSize(task.descr, 180);
    doc.text(descrLines, 14, yPos);
    yPos += descrLines.length * 5 + 5;
  } else {
    yPos += 5;
  }
  
  // Tableau des items
  if (task.items && task.items.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Tâches (${task.items.length})`, 14, yPos);
    yPos += 10;
    
    // Préparer les données pour le tableau
    const tableData = task.items.map((item: any) => [
      item.order.toString(),
      item.harpitem?.descr || item.title || "N/A",
      getTrigNetid(item.resourceNetid) || "N/A",
      item.startDate ? formatDateTime(item.startDate) : "N/A",
      item.endDate ? formatDateTime(item.endDate) : "N/A",
      formatElapsedTime(item.startDate, item.endDate),
      item.resourceNetid || "N/A",
      statusLabels[item.status] || item.status,
      item.predecessor?.title || item.predecessor?.harpitem?.descr || "Aucun",
      item.comment || "",
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [["Ordre", "Tâches", "Trig Netid", "Début", "Fin", "Écoulé", "Ressource", "Statut", "Prédécesseur", "Commentaire"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: orangeColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
        columnStyles: {
          0: { cellWidth: 15 }, // Ordre
          1: { cellWidth: 50 }, // Tâches
          2: { cellWidth: 20 }, // Trig Netid
          3: { cellWidth: 35 }, // Début
          4: { cellWidth: 35 }, // Fin
          5: { cellWidth: 25 }, // Écoulé
          6: { cellWidth: 25 }, // Ressource
          7: { cellWidth: 25 }, // Statut
          8: { cellWidth: 30 }, // Prédécesseur
          9: { cellWidth: 40 }, // Commentaire
        },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Aucune tâche enregistrée", 14, yPos);
  }
  
  // Convertir le PDF en buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

/**
 * Envoie une chrono-tâche par email avec pièce jointe
 */
export async function sendTaskByEmail(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour envoyer un email" };
    }

    const rawData = {
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      exportType: formData.get("exportType") as "excel" | "pdf",
      taskId: formData.get("taskId") as string,
      userIds: formData.getAll("userIds").map(id => id as string).filter(Boolean),
      roleIds: formData.getAll("roleIds").map(id => id as string).filter(Boolean),
    };

    const validatedData = SendTaskEmailSchema.parse(rawData);

    // Récupérer la tâche avec tous ses items
    const task = await db.harptask.findUnique({
      where: { id: parseInt(validatedData.taskId, 10) },
      include: {
        items: {
          include: {
            predecessor: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Chrono-tâche non trouvée" };
    }

    // Générer le fichier
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (validatedData.exportType === 'excel') {
      fileBuffer = await generateExcelBuffer(task);
      fileName = `Chrono-tache_${task.id}_${task.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      fileBuffer = await generatePDFBuffer(task);
      fileName = `Chrono-tache_${task.id}_${task.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      mimeType = 'application/pdf';
    }

    // Récupérer les emails des destinataires
    const recipientEmails: Array<{ email: string; name: string }> = [];
    
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
    
    if (validatedData.roleIds.length > 0) {
      const roleUsers = await db.user.findMany({
        where: {
          roles: {
            some: {
              roleId: { in: validatedData.roleIds.map(id => parseInt(id, 10)) },
            },
          },
          email: { not: null },
        },
        select: {
          email: true,
          name: true,
          netid: true,
        },
      });
      
      roleUsers.forEach(user => {
        if (user.email && !recipientEmails.some(r => r.email === user.email)) {
          recipientEmails.push({
            email: user.email,
            name: user.name || user.netid || 'Utilisateur',
          });
        }
      });
    }

    if (recipientEmails.length === 0) {
      return { success: false, error: "Aucun destinataire valide trouvé." };
    }

    // Envoyer les emails
    const emailResults = await Promise.all(
      recipientEmails.map(async (recipient) => {
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
          attachments: [{
            filename: fileName,
            content: fileBuffer,
            contentType: mimeType,
          }],
        });

        return {
          email: recipient.email,
          success: result.success,
          error: result.error,
        };
      })
    );

    const emailsSent = emailResults.filter(r => r.success).length;
    const emailsFailed = emailResults.filter(r => !r.success).length;

    let message = `${emailsSent} email${emailsSent > 1 ? 's ont' : ' a'} été envoyé${emailsSent > 1 ? 's' : ''} avec succès`;
    if (emailsFailed > 0) {
      message += `. ${emailsFailed} email${emailsFailed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyé${emailsFailed > 1 ? 's' : ''}`;
    }

    revalidatePath(`/list/tasks/${validatedData.taskId}`);

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

