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

// Mapping entre les IDs de colonnes et les données à exporter
const columnMapping: Record<string, { label: string; getValue: (env: any) => string }> = {
  'env': { label: 'Base', getValue: (env) => env.env || '' },
  'harpora.descr': { label: 'Description', getValue: (env) => env.harpora?.descr || '' },
  'harpora.orarelease': { label: 'Ora Release', getValue: (env) => env.harpora?.orarelease || '' },
  'ptversion': { label: 'Ptools', getValue: (env) => env.ptversion || '' },
  'harprelease': { label: 'Release', getValue: (env) => env.harprelease || '' },
  'server': { label: 'Serveur', getValue: (env) => env.server || '' },
  'anonym': { label: 'Anonym', getValue: (env) => env.anonym === 'N' ? 'Oui' : 'Non' },
  'edi': { label: 'EDI', getValue: (env) => env.edi || '' },
  'aliasql': { label: 'Alias SQL', getValue: (env) => env.aliasql || '' },
  'oraschema': { label: 'Schema', getValue: (env) => env.oraschema || '' },
  'psversion': { label: 'PSoft', getValue: (env) => env.psversion || '' },
};

/**
 * Génère un fichier Excel en mémoire pour les environnements avec uniquement les colonnes visibles
 */
async function generateExcelBuffer(envs: any[], visibleColumns: string[] = []): Promise<Buffer> {
  // Debug: afficher les colonnes visibles reçues
  console.log('generateExcelBuffer - Colonnes visibles reçues:', visibleColumns);
  console.log('generateExcelBuffer - Mapping disponible:', Object.keys(columnMapping));
  
  // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
  const columnsToExport = visibleColumns.length > 0 
    ? visibleColumns.filter(col => {
        const exists = !!columnMapping[col];
        if (!exists) {
          console.warn(`Colonne "${col}" non trouvée dans le mapping`);
        }
        return exists;
      })
    : Object.keys(columnMapping);
  
  console.log('generateExcelBuffer - Colonnes à exporter:', columnsToExport);

  // Préparer les données avec uniquement les colonnes visibles
  const envsData = envs.map((env) => {
    const row: Record<string, string> = {};
    columnsToExport.forEach(colId => {
      const mapping = columnMapping[colId];
      if (mapping) {
        row[mapping.label] = mapping.getValue(env);
      }
    });
    return row;
  });

  // Utiliser xlsx pour créer le fichier
  const worksheet = XLSX.utils.json_to_sheet(envsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Environnements");
  
  // Générer le buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
}

/**
 * Génère un fichier PDF en mémoire pour les environnements avec uniquement les colonnes visibles
 */
async function generatePDFBuffer(envs: any[], visibleColumns: string[] = []): Promise<Buffer> {
  const doc = new jsPDF();
  const orangeColor = [255, 140, 0];
  
  doc.setFillColor(...orangeColor);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Liste des environnements", 14, 20);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total: ${envs.length} environnement${envs.length > 1 ? "s" : ""} - Généré le ${new Date().toLocaleString("fr-FR")}`,
    14,
    35
  );
  
  if (envs.length > 0) {
    // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
    const columnsToExport = visibleColumns.length > 0 
      ? visibleColumns.filter(col => columnMapping[col])
      : Object.keys(columnMapping);

    // Préparer les en-têtes et les données pour le tableau
    const headers = columnsToExport
      .map(colId => columnMapping[colId]?.label)
      .filter(Boolean) as string[];

    const tableData = envs.map((env) => 
      columnsToExport.map(colId => {
        const mapping = columnMapping[colId];
        return mapping ? mapping.getValue(env) : '';
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
 * Envoie un export d'environnements par email avec pièce jointe
 */
export async function sendEnvsExportByEmail(formData: FormData) {
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

    // Récupérer les environnements
    const envsData = await db.envsharp.findMany({
      include: {
        statutenv: true,
      },
      orderBy: {
        env: 'asc',
      },
    });

    const envIds = envsData.map(env => env.id);
    
    // Récupérer les données harpora
    const harporaData = await db.harpora.findMany({
      where: {
        envId: { in: envIds },
      },
      select: {
        envId: true,
        orarelease: true,
        descr: true,
      },
      orderBy: {
        createddt: 'desc',
      },
    });

    const harporaMap = new Map<number, { orarelease: string | null; descr: string | null }>();
    harporaData.forEach(ora => {
      if (!harporaMap.has(ora.envId)) {
        harporaMap.set(ora.envId, { orarelease: ora.orarelease, descr: ora.descr });
      }
    });

    // Récupérer les serveurs
    const harpenvservData = await db.harpenvserv.findMany({
      where: {
        envId: { in: envIds },
        typsrv: 'DB',
      },
      select: {
        envId: true,
        harpserve: {
          select: {
            srv: true,
          },
        },
      },
    });

    const serverMap = new Map<number, string | null>();
    harpenvservData.forEach(envserv => {
      if (envserv.envId && !serverMap.has(envserv.envId)) {
        serverMap.set(envserv.envId, envserv.harpserve?.srv || null);
      }
    });

    const enrichedEnvs = envsData.map(env => ({
      ...env,
      harpora: harporaMap.get(env.id) || { orarelease: null, descr: null },
      server: serverMap.get(env.id) || null,
    }));

    // Générer le fichier avec uniquement les colonnes visibles
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (validatedData.exportType === 'excel') {
      fileBuffer = await generateExcelBuffer(enrichedEnvs, validatedData.visibleColumns || []);
      fileName = `Environnements_${new Date().toISOString().split("T")[0]}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      fileBuffer = await generatePDFBuffer(enrichedEnvs, validatedData.visibleColumns || []);
      fileName = `Environnements_${new Date().toISOString().split("T")[0]}.pdf`;
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
        distinct: ['email'],
      });
      
      roleUsers.forEach(user => {
        if (user.email && !recipientEmails.find(r => r.email === user.email)) {
          recipientEmails.push({
            email: user.email,
            name: user.name || user.netid || 'Utilisateur',
          });
        }
      });
    }

    if (recipientEmails.length === 0) {
      return { success: false, error: "Aucun destinataire valide trouvé" };
    }

    // Envoyer les emails avec pièce jointe
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
        attachments: [
          {
            filename: fileName,
            content: fileBuffer,
            contentType: mimeType,
          },
        ],
      });
      
      return { email: recipient.email, success: result.success };
    });
    
    const emailResults = await Promise.all(emailPromises);
    const emailsSent = emailResults.filter(r => r.success).length;
    const emailsFailed = emailResults.filter(r => !r.success).length;
    
    let message = `${emailsSent} email${emailsSent > 1 ? 's ont' : ' a'} été envoyé${emailsSent > 1 ? 's' : ''} avec succès`;
    if (emailsFailed > 0) {
      message += `. ${emailsFailed} email${emailsFailed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyé${emailsFailed > 1 ? 's' : ''}`;
    }

    revalidatePath("/list/envs");

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

