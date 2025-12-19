import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Types pour l'export (compatibles avec les données de getTaskById)
export interface TaskItem {
  id: number;
  title: string;
  order: number;
  duration?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  resourceNetid?: string | null;
  status: string;
  comment?: string | null;
  predecessor?: { id: number; title: string } | null;
  harpitemId?: number | null;
  harpitem?: { id: number; descr: string } | null;
}

export interface Task {
  id: number;
  title: string;
  descr?: string | null;
  status: string;
  date?: Date | string | null;
  estimatedDuration?: number | null;
  effectiveDuration?: number | null;
  items?: TaskItem[];
}

/**
 * Exporte une chrono-tâche au format Excel
 */
// Fonction pour calculer trigNetid (3 premiers caractères de resourceNetid en majuscules)
const getTrigNetid = (resourceNetid: string | null | undefined): string => {
  if (!resourceNetid) return "";
  return resourceNetid.substring(0, 3).toUpperCase();
};

export async function exportTaskToExcel(task: Task) {
  try {
    // Créer un nouveau workbook et worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Chrono-tâche");

    // Définir les en-têtes de colonnes
    const headers = [
      "Ordre",
      "Tâches",
      "Prédécesseur",
      "Trig Netid",
      "Date début",
      "Date fin",
      "Temps écoulé",
      "Statut",
      "Commentaire",
    ];

    // Ajouter les en-têtes avec style (gras, blanc sur fond bleu marine) - formatage cellule par cellule
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 20;
    
    // Formater chaque cellule d'en-tête individuellement
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1); // Les indices commencent à 1
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF001F3F" }, // Bleu marine / Navy
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Préparer et ajouter les données
    (task.items || []).forEach((item) => {
      const row = worksheet.addRow([
        item.order,
        item.harpitem?.descr || item.title || "N/A",
        item.predecessor?.title || item.predecessor?.harpitem?.descr || "Aucun",
        getTrigNetid(item.resourceNetid) || "N/A",
        item.startDate ? formatDateTime(item.startDate) : "N/A",
        item.endDate ? formatDateTime(item.endDate) : "N/A",
        formatElapsedTime(item.startDate, item.endDate),
        statusLabels[item.status] || item.status,
        item.comment || "",
      ]);
      row.alignment = { vertical: "middle" };
    });

    // Ajuster la largeur des colonnes automatiquement
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.header.length + 2, 12);
      }
    });

    // Générer le fichier et le télécharger
    const fileName = `Chrono-tache_${task.id}_${task.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Créer un blob et télécharger
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    throw new Error("Erreur lors de l'export Excel");
  }
}

/**
 * Exporte une chrono-tâche au format PDF
 */
export function exportTaskToPDF(task: Task) {
  try {
    const doc = new jsPDF();
    
    // Configuration des couleurs
    const orangeColor = [255, 140, 0];
    const grayColor = [128, 128, 128];
    
    // En-tête avec fond orange
    doc.setFillColor(...orangeColor);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Chrono-tâche", 14, 17);
    
    // Informations de la tâche
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 33;
    
    doc.setFont("helvetica", "bold");
    doc.text("Titre:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(task.title, 50, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text("ID:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(task.id.toString(), 50, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text("Statut:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(statusLabels[task.status] || task.status, 50, yPos);
    yPos += 5;
    
    if (task.date) {
      doc.setFont("helvetica", "bold");
      doc.text("Date prévue:", 14, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(task.date), 50, yPos);
      yPos += 5;
    }
    
    if (task.estimatedDuration) {
      doc.setFont("helvetica", "bold");
      doc.text("Durée estimée:", 14, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(formatDuration(task.estimatedDuration), 50, yPos);
      yPos += 5;
    }
    
    if (task.effectiveDuration !== null && task.effectiveDuration !== undefined) {
      doc.setFont("helvetica", "bold");
      doc.text("Durée effective:", 14, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(formatDuration(task.effectiveDuration), 50, yPos);
      yPos += 5;
    }
    
    if (task.descr) {
      yPos += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Description:", 14, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const descrLines = doc.splitTextToSize(task.descr, 180);
      doc.text(descrLines, 14, yPos);
      yPos += descrLines.length * 4 + 3;
      doc.setFontSize(10);
    } else {
      yPos += 3;
    }
    
    // Tableau des items
    if (task.items && task.items.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Tâches (${task.items.length})`, 14, yPos);
      yPos += 7;
      
      // Préparer les données pour le tableau
      const tableData = task.items.map((item) => [
        item.order.toString(),
        item.harpitem?.descr || item.title || "N/A",
        item.predecessor?.title || item.predecessor?.harpitem?.descr || "Aucun",
        getTrigNetid(item.resourceNetid) || "N/A",
        item.startDate ? formatDateTime(item.startDate) : "N/A",
        item.endDate ? formatDateTime(item.endDate) : "N/A",
        formatElapsedTime(item.startDate, item.endDate),
        statusLabels[item.status] || item.status,
        item.comment || "",
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Ordre", "Tâches", "Prédécesseur", "Trig Netid", "Date début", "Date fin", "Temps écoulé", "Statut", "Commentaire"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: orangeColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 1.5,
        },
        styles: {
          fontSize: 6,
          cellPadding: 1,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        columnStyles: {
          0: { cellWidth: 10 }, // Ordre
          1: { cellWidth: 32 }, // Tâches
          2: { cellWidth: 22 }, // Prédécesseur
          3: { cellWidth: 14 }, // Trig Netid
          4: { cellWidth: 26 }, // Date début
          5: { cellWidth: 26 }, // Date fin
          6: { cellWidth: 18 }, // Temps écoulé
          7: { cellWidth: 18 }, // Statut
          8: { cellWidth: 28 }, // Commentaire
        },
        margin: { left: 7, right: 7 },
        tableWidth: "wrap",
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Aucune tâche enregistrée", 14, yPos);
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleString("fr-FR")}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    const fileName = `Chrono-tache_${task.id}_${task.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Erreur lors de l'export PDF");
  }
}
