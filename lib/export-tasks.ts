import xlsx, { IJsonSheet } from "json-as-xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface TaskData {
  id: number;
  title: string;
  descr: string | null;
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
  date: Date | null;
  estimatedDuration: number | null;
  effectiveDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
}

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
const columnMapping: Record<string, { label: string; getValue: (task: TaskData) => string }> = {
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
 * Exporte les chrono-tâches au format Excel avec uniquement les colonnes visibles
 */
export function exportTasksToExcel(tasks: TaskData[], visibleColumns: string[] = []) {
  try {
    // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
    const columnsToExport = visibleColumns.length > 0 
      ? visibleColumns.filter(col => columnMapping[col])
      : Object.keys(columnMapping);

    // Préparer les données pour Excel avec uniquement les colonnes visibles
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

    const excelColumns = columnsToExport
      .map(colId => columnMapping[colId])
      .filter(Boolean)
      .map(mapping => ({
        label: mapping.label,
        value: mapping.label,
      }));

    const columns: IJsonSheet[] = [
      {
        sheet: "Chrono-tâches",
        columns: excelColumns,
        content: tasksData,
      },
    ];

    const fileName = `Chrono-taches_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    xlsx(columns, {
      fileName: fileName,
    });

    return fileName;
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    throw new Error("Erreur lors de l'export Excel");
  }
}

/**
 * Exporte les chrono-tâches au format PDF avec uniquement les colonnes visibles
 */
export function exportTasksToPDF(tasks: TaskData[], visibleColumns: string[] = []) {
  try {
    const doc = new jsPDF();
    
    // Configuration des couleurs
    const orangeColor = [255, 140, 0];
    
    // En-tête avec fond orange
    doc.setFillColor(...orangeColor);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Liste des chrono-tâches", 14, 20);
    
    // Informations générales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total: ${tasks.length} chrono-tâche${tasks.length > 1 ? "s" : ""} - Généré le ${new Date().toLocaleString("fr-FR")}`,
      14,
      35
    );
    
    // Tableau des chrono-tâches
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
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Aucune chrono-tâche enregistrée", 14, 50);
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    const fileName = `Chrono-taches_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Erreur lors de l'export PDF");
  }
}

