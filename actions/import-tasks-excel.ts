"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { createTask } from "./create-task";
import { createTaskItem } from "./create-task-item";

/**
 * Importe les chrono-tâches depuis un fichier Excel
 * Structure flexible : détecte automatiquement les colonnes par nom ou position
 */
export async function importTasksFromExcel(fileBuffer: Buffer) {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire les données avec les en-têtes
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
    });

    if (data.length === 0) {
      return { error: "Le fichier Excel est vide" };
    }

    const results = {
      tasksCreated: 0,
      itemsCreated: 0,
      errors: [] as string[],
    };

    // Normaliser les noms de colonnes (insensible à la casse, avec/sans accents)
    const normalizeColumnName = (name: string): string => {
      if (!name) return "";
      return name.toLowerCase()
        .trim()
        .replace(/[éèêë]/g, "e")
        .replace(/[àâä]/g, "a")
        .replace(/[îï]/g, "i")
        .replace(/[ôö]/g, "o")
        .replace(/[ùûü]/g, "u")
        .replace(/[ç]/g, "c");
    };

    // Fonction pour extraire une valeur d'une ligne selon différents noms possibles
    const getValue = (row: any, possibleNames: string[]): any => {
      for (const name of possibleNames) {
        // Chercher par nom exact
        if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
          return row[name];
        }
        // Chercher par nom normalisé
        for (const key in row) {
          if (normalizeColumnName(key) === normalizeColumnName(name)) {
            return row[key];
          }
        }
      }
      return null;
    };

    // Grouper les lignes par chrono-tâche
    // On suppose que la première colonne ou une colonne "identifiant" contient l'ID de la chrono-tâche
    const tasksMap = new Map<string, any[]>();

    for (const row of data) {
      // Chercher l'identifiant de la chrono-tâche dans différentes colonnes possibles
      const taskIdentifier = getValue(row, [
        "identifiant chrono-tache",
        "identifiant chronotache",
        "identifiant",
        "id chrono-tache",
        "id chronotache",
        "chrono-tache",
        "chronotache",
        Object.keys(row)[0], // Première colonne par défaut
      ]);

      if (!taskIdentifier || String(taskIdentifier).trim() === "") {
        results.errors.push("Ligne sans identifiant de chrono-tâche ignorée");
        continue;
      }

      const taskId = String(taskIdentifier).trim();
      if (!tasksMap.has(taskId)) {
        tasksMap.set(taskId, []);
      }
      tasksMap.get(taskId)!.push(row);
    }

    // Créer chaque chrono-tâche et ses items
    for (const [taskIdentifier, rows] of tasksMap.entries()) {
      try {
        // Créer la chrono-tâche (utiliser la première ligne pour le titre)
        const firstRow = rows[0];
        const taskTitle = getValue(firstRow, [
          "titre chrono-tache",
          "titre chronotache",
          "titre",
          "title",
          Object.keys(firstRow)[1] || "", // Deuxième colonne par défaut
        ]) || taskIdentifier;

        const taskResult = await createTask({
          title: String(taskTitle),
          descr: null,
        });

        let taskId: number;

        if (taskResult.error) {
          // Si la tâche existe déjà, chercher par titre
          const existingTask = await db.harptask.findFirst({
            where: { title: String(taskTitle) },
          });

          if (!existingTask) {
            results.errors.push(`Erreur création chrono-tâche ${taskIdentifier}: ${taskResult.error}`);
            continue;
          }

          taskId = existingTask.id;
        } else if (taskResult.success && taskResult.data) {
          results.tasksCreated++;
          taskId = taskResult.data.id;
        } else {
          results.errors.push(`Erreur création chrono-tâche ${taskIdentifier}`);
          continue;
        }

        // Créer les items pour cette chrono-tâche
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          
          // Extraire les valeurs avec différents noms possibles
          const itemTitle = getValue(row, [
            "titre tache",
            "titre tâche",
            "titre",
            "title",
            Object.keys(row)[2] || "", // Troisième colonne par défaut
          ]) || `Tâche ${i + 1}`;

          // duration field removed - no longer used

          const startDateStr = getValue(row, ["date debut", "date début", "date_debut", "startdate", "start date"]);
          let startDate: Date | null = null;
          if (startDateStr) {
            const start = new Date(String(startDateStr));
            if (!isNaN(start.getTime())) {
              startDate = start;
            }
          }

          const endDateStr = getValue(row, ["date fin", "date_fin", "enddate", "end date"]);
          let endDate: Date | null = null;
          if (endDateStr) {
            const end = new Date(String(endDateStr));
            if (!isNaN(end.getTime())) {
              endDate = end;
            }
          }

          const resourceNetid = getValue(row, ["ressource", "resource", "user", "netid", "trigramme"]);
          const predecessorTitle = getValue(row, ["predecesseur", "prédécesseur", "predecessor", "depend de", "dépend de"]);

          // Déterminer le statut
          const statutStr = getValue(row, ["statut", "status", "etat", "état"]);
          let status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC" = "EN_ATTENTE";
          if (statutStr) {
            const statutUpper = String(statutStr).toUpperCase().trim()
              .replace(/[ÉÈÊË]/g, "E")
              .replace(/[ÀÂÄ]/g, "A");
            
            if (statutUpper === "EN ATTENTE" || statutUpper === "EN_ATTENTE") status = "EN_ATTENTE";
            else if (statutUpper === "EN COURS" || statutUpper === "EN_COURS") status = "EN_COURS";
            else if (statutUpper === "BLOQUE" || statutUpper === "BLOQUÉ") status = "BLOQUE";
            else if (statutUpper === "TERMINE" || statutUpper === "TERMINÉ") status = "TERMINE";
            else if (statutUpper === "SUCCES" || statutUpper === "SUCCÈS") status = "SUCCES";
            else if (statutUpper === "ECHEC" || statutUpper === "ÉCHEC") status = "ECHEC";
          }

          const comment = getValue(row, ["commentaire", "comment", "notes", "note"]);

          // Chercher ou créer l'item réutilisable (harpitem) à partir du titre
          let harpitemId: number | null = null;
          if (itemTitle) {
            // Chercher d'abord si l'item existe déjà
            let harpitem = await db.harpitems.findUnique({
              where: { descr: String(itemTitle) },
            });
            
            // Si l'item n'existe pas, le créer
            if (!harpitem) {
              harpitem = await db.harpitems.create({
                data: { descr: String(itemTitle) },
              });
            }
            
            harpitemId = harpitem.id;
          }

          // Chercher le prédécesseur par harpitem si spécifié
          let predecessorId: number | null = null;
          if (predecessorTitle) {
            // Trouver le harpitem du prédécesseur
            const predecessorHarpitem = await db.harpitems.findUnique({
              where: { descr: String(predecessorTitle) },
            });
            
            if (predecessorHarpitem) {
              // Chercher la tâche avec ce harpitem dans la même chrono-tâche
              const predecessor = await db.harptaskitem.findFirst({
                where: {
                  taskId: taskId,
                  harpitemId: predecessorHarpitem.id,
                },
              });
              if (predecessor) {
                predecessorId = predecessor.id;
              }
            }
          }

          const itemResult = await createTaskItem({
            taskId: taskId,
            harpitemId: harpitemId,
            startDate: startDate,
            endDate: endDate,
            resourceNetid: resourceNetid ? String(resourceNetid) : null,
            predecessorId: predecessorId,
            status: status,
            comment: comment ? String(comment) : null,
            order: i + 1,
          });

          if (itemResult.success) {
            results.itemsCreated++;
          } else {
            results.errors.push(`Erreur création tâche "${itemTitle}": ${itemResult.error}`);
          }
        }
      } catch (error) {
        results.errors.push(`Erreur traitement chrono-tâche ${taskIdentifier}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    revalidatePath("/list/tasks");
    return {
      success: true,
      message: `Import terminé: ${results.tasksCreated} chrono-tâche(s) créée(s), ${results.itemsCreated} tâche(s) créée(s)${results.errors.length > 0 ? `, ${results.errors.length} erreur(s)` : ""}`,
      ...results,
    };
  } catch (error) {
    console.error("Erreur lors de l'import Excel:", error);
    return {
      error: `Erreur lors de l'import: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
