import xlsx, { IJsonSheet } from "json-as-xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Type pour les données d'environnement
export interface EnvData {
  id: number;
  env: string;
  aliasql: string | null;
  oraschema: string | null;
  orarelease: string | null;
  url: string | null;
  appli: string | null;
  psversion: string | null;
  ptversion: string | null;
  harprelease: string | null;
  pshome: string | null;
  volum: string | null;
  descr: string | null;
  anonym: string | null;
  edi: string | null;
  harpora: {
    orarelease: string | null;
    descr: string | null;
  };
  server: string | null;
  statutenv: {
    id: number;
    statenv: string;
    descr: string | null;
  } | null;
}

// Mapping entre les IDs de colonnes et les données à exporter
const columnMapping: Record<string, { label: string; getValue: (env: EnvData) => string }> = {
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
 * Exporte les environnements au format Excel avec uniquement les colonnes visibles
 */
export function exportEnvsToExcel(envs: EnvData[], visibleColumns: string[] = []) {
  try {
    // Debug: afficher les colonnes visibles reçues
    console.log('exportEnvsToExcel - Colonnes visibles reçues:', visibleColumns);
    console.log('exportEnvsToExcel - Mapping disponible:', Object.keys(columnMapping));
    
    // Si aucune colonne visible spécifiée, utiliser toutes les colonnes par défaut
    const columnsToExport = visibleColumns.length > 0 
      ? visibleColumns.filter(col => {
          const exists = !!columnMapping[col];
          if (!exists) {
            console.warn(`⚠️ Colonne "${col}" non trouvée dans le mapping. Colonnes disponibles:`, Object.keys(columnMapping));
          } else {
            console.log(`✅ Colonne "${col}" trouvée dans le mapping`);
          }
          return exists;
        })
      : Object.keys(columnMapping);
    
    console.log('exportEnvsToExcel - Colonnes à exporter (final):', columnsToExport);
    console.log('exportEnvsToExcel - Nombre de colonnes à exporter:', columnsToExport.length);

    // Préparer les données pour Excel avec uniquement les colonnes visibles
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

    const excelColumns = columnsToExport
      .map(colId => columnMapping[colId])
      .filter(Boolean)
      .map(mapping => ({
        label: mapping.label,
        value: mapping.label,
      }));

    const columns: IJsonSheet[] = [
      {
        sheet: "Environnements",
        columns: excelColumns,
        content: envsData,
      },
    ];

    const fileName = `Environnements_${new Date().toISOString().split("T")[0]}.xlsx`;
    
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
 * Exporte les environnements au format PDF avec uniquement les colonnes visibles
 */
export function exportEnvsToPDF(envs: EnvData[], visibleColumns: string[] = []) {
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
    doc.text("Liste des environnements", 14, 20);
    
    // Informations générales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total: ${envs.length} environnement${envs.length > 1 ? "s" : ""} - Généré le ${new Date().toLocaleString("fr-FR")}`,
      14,
      35
    );
    
    // Tableau des environnements
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
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Aucun environnement enregistré", 14, 50);
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
    
    const fileName = `Environnements_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Erreur lors de l'export PDF");
  }
}

/**
 * Génère un fichier Excel en mémoire et retourne le buffer
 */
export async function generateExcelBuffer(envs: EnvData[]): Promise<Buffer> {
  try {
    const envsData = envs.map((env) => ({
      "Base": env.env || "",
      "Description": env.harpora?.descr || "",
      "Ora Release": env.harpora?.orarelease || "",
      "Ptools": env.ptversion || "",
      "Release": env.harprelease || "",
      "Serveur": env.server || "",
      "Anonym": env.anonym === "N" ? "Oui" : "Non",
      "EDI": env.edi || "",
    }));

    const columns: IJsonSheet[] = [
      {
        sheet: "Environnements",
        columns: [
          { label: "Base", value: "Base" },
          { label: "Description", value: "Description" },
          { label: "Ora Release", value: "Ora Release" },
          { label: "Ptools", value: "Ptools" },
          { label: "Release", value: "Release" },
          { label: "Serveur", value: "Serveur" },
          { label: "Anonym", value: "Anonym" },
          { label: "EDI", value: "EDI" },
        ],
        content: envsData,
      },
    ];

    // Note: json-as-xlsx ne supporte pas directement le buffer, 
    // on devra utiliser une autre approche pour l'envoi par email
    // Pour l'instant, on retourne un buffer vide (sera implémenté différemment)
    return Buffer.from("");
  } catch (error) {
    console.error("Erreur lors de la génération du buffer Excel:", error);
    throw new Error("Erreur lors de la génération du buffer Excel");
  }
}

