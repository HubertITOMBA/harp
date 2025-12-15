import xlsx, { IJsonSheet } from "json-as-xlsx";
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
export function exportTaskToExcel(task: Task) {
  try {
    // Préparer les données des items pour Excel
    const itemsData = (task.items || []).map((item) => ({
      "Ordre": item.order,
      "Titre": item.title,
      "Durée (min)": item.duration || "N/A",
      "Date début": item.startDate ? formatDateTime(item.startDate) : "N/A",
      "Date fin": item.endDate ? formatDateTime(item.endDate) : "N/A",
      "Temps écoulé": formatElapsedTime(item.startDate, item.endDate),
      "Ressource": item.resourceNetid || "N/A",
      "Statut": statusLabels[item.status] || item.status,
      "Prédécesseur": item.predecessor?.title || "Aucun",
      "Commentaire": item.comment || "",
    }));

    const columns: IJsonSheet[] = [
      {
        sheet: "Chrono-tâche",
        columns: [
          { label: "Ordre", value: "Ordre" },
          { label: "Titre", value: "Titre" },
          { label: "Durée (min)", value: "Durée (min)" },
          { label: "Date début", value: "Date début" },
          { label: "Date fin", value: "Date fin" },
          { label: "Temps écoulé", value: "Temps écoulé" },
          { label: "Ressource", value: "Ressource" },
          { label: "Statut", value: "Statut" },
          { label: "Prédécesseur", value: "Prédécesseur" },
          { label: "Commentaire", value: "Commentaire" },
        ],
        content: itemsData,
      },
    ];

    const fileName = `Chrono-tache_${task.id}_${task.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    xlsx(columns, {
      fileName: fileName,
    });
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
      const tableData = task.items.map((item) => [
        item.order.toString(),
        item.title,
        item.duration ? `${item.duration} min` : "N/A",
        item.startDate ? formatDateTime(item.startDate) : "N/A",
        item.endDate ? formatDateTime(item.endDate) : "N/A",
        formatElapsedTime(item.startDate, item.endDate),
        item.resourceNetid || "N/A",
        statusLabels[item.status] || item.status,
        item.predecessor?.title || "Aucun",
        item.comment || "",
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Ordre", "Titre", "Durée", "Début", "Fin", "Écoulé", "Ressource", "Statut", "Prédécesseur", "Commentaire"]],
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
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 },
          8: { cellWidth: 30 },
          9: { cellWidth: 40 },
        },
        margin: { left: 14, right: 14 },
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
