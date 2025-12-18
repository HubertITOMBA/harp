"use server";

import { auth } from "@/auth";
import { sendMail } from "@/lib/mail";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const SendExportEmailSchema = z.object({
  subject: z.string().min(1, "Le sujet est requis"),
  message: z.string().min(1, "Le message est requis"),
  exportType: z.enum(["excel", "pdf"]),
  userIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
  visibleColumns: z.array(z.string()).optional(),
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
  if (!minutes) return "-";
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
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Mapping entre les IDs de colonnes et les données à exporter
const columnMapping: Record<string, { label: string; getValue: (task: any) => string }> = {
  'title': { label: 'Titre', getValue: (task) => task.title || '' },
  'status': { label: 'Statut', getValue: (task) => statusLabels[task.status] || task.status },
  '_count.items': { label: 'Nb tâches', getValue: (task) => task._count?.items?.toString() || '0' },
  'date': { label: 'Date prévue', getValue: (task) => formatDate(task.date) },
  'estimatedDuration': { label: 'Durée estimée', getValue: (task) => formatDuration(task.estimatedDuration) },
  'effectiveDuration': { label: 'Durée effective', getValue: (task) => formatDuration(task.effectiveDuration) },
  'createdAt': { label: 'Créé le', getValue: (task) => formatDateTime(task.createdAt) },
  'updatedAt': { label: 'Modifié le', getValue: (task) => formatDateTime(task.updatedAt) },
  'descr': { label: 'Description', getValue: (task) => task.descr || '' },
};

/**
 * Génère un fichier Excel en mémoire pour les chrono-tâches avec uniquement les colonnes visibles
 */
async function generateExcelBuffer(tasks: any[], visibleColumns: string[] = []): Promise<Buffer> {
  // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
  const columnsToExport = visibleColumns.length > 0 
    ? visibleColumns.filter(col => columnMapping[col])
    : Object.keys(columnMapping);

  // Préparer les données avec uniquement les colonnes visibles
  const tasksData = tasks.map((task) => {
    const row: Record<string, string> = {};
    columnsToExport.forEach(colId => {
      const mapping = columnMapping[colId];
      if (mapping) {
        row[mapping.label] = mapping.getValue(task);
      }
    });
    return row;
  });

  // Utiliser xlsx pour créer le fichier
  const worksheet = XLSX.utils.json_to_sheet(tasksData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chrono-tâches");
  
  // Générer le buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
}

/**
 * Génère un fichier PDF en mémoire pour les chrono-tâches avec uniquement les colonnes visibles
 */
async function generatePDFBuffer(tasks: any[], visibleColumns: string[] = []): Promise<Buffer> {
  const doc = new jsPDF();
  const orangeColor = [255, 140, 0];
  
  doc.setFillColor(...orangeColor);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Liste des chrono-tâches", 14, 20);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total: ${tasks.length} chrono-tâche${tasks.length > 1 ? "s" : ""} - Généré le ${new Date().toLocaleString("fr-FR")}`,
    14,
    35
  );
  
  if (tasks.length > 0) {
    // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
    const columnsToExport = visibleColumns.length > 0 
      ? visibleColumns.filter(col => columnMapping[col])
      : Object.keys(columnMapping);

    // Préparer les en-têtes et les données pour le tableau
    const headers = columnsToExport
      .map(colId => columnMapping[colId]?.label)
      .filter(Boolean) as string[];

    const tableData = tasks.map((task) => 
      columnsToExport.map(colId => {
        const mapping = columnMapping[colId];
        return mapping ? mapping.getValue(task) : '';
      })
    );

    // Calculer les largeurs de colonnes dynamiquement
    const totalWidth = 182; // Largeur disponible (210 - 28 de marges)
    const columnWidth = totalWidth / headers.length;
    const columnStyles: Record<number, { cellWidth: number }> = {};
    headers.forEach((_, index) => {
      columnStyles[index] = { cellWidth: columnWidth };
    });
    
    autoTable(doc, {
      startY: 42,
      head: [headers],
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
      columnStyles,
      margin: { left: 14, right: 14 },
    });
  }
  
  // Convertir le PDF en buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

/**
 * Envoie un export de chrono-tâches par email avec pièce jointe
 */
export async function sendTasksExportByEmail(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour envoyer un email" };
    }

    const rawData = {
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      exportType: formData.get("exportType") as "excel" | "pdf",
      userIds: formData.getAll("userIds").map(id => id as string).filter(Boolean),
      roleIds: formData.getAll("roleIds").map(id => id as string).filter(Boolean),
      visibleColumns: formData.getAll("visibleColumns").map(col => col as string).filter(Boolean),
    };

    const validatedData = SendExportEmailSchema.parse(rawData);

    // Récupérer les chrono-tâches
    const tasksData = await db.harptask.findMany({
      select: {
        id: true,
        title: true,
        descr: true,
        status: true,
        date: true,
        estimatedDuration: true,
        effectiveDuration: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Générer le fichier avec uniquement les colonnes visibles
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (validatedData.exportType === 'excel') {
      fileBuffer = await generateExcelBuffer(tasksData, validatedData.visibleColumns || []);
      fileName = `Chrono-taches_${new Date().toISOString().split("T")[0]}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      fileBuffer = await generatePDFBuffer(tasksData, validatedData.visibleColumns || []);
      fileName = `Chrono-taches_${new Date().toISOString().split("T")[0]}.pdf`;
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

    revalidatePath("/list/tasks");

    return {
      success: emailsSent > 0,
      message: emailsSent > 0 ? message : "Aucun email n'a pu être envoyé"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur lors de l'envoi de l'export par email:", error);
    return { success: false, error: "Erreur lors de l'envoi de l'export par email" };
  }
}

