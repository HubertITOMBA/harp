"use server"

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/** Dossier des fichiers générés par le script de statut d'applications (même logique que env.* / release.*) */
const FILES_DIR =
  process.env.PORTAL_HARP_FILES ||
  (process.platform === "win32"
    ? "C:\\produits\\portail_harp\\files"
    : "/produits/portail_harp/files");

/** Fichiers attendus : appstatus.*.txt contenant des lignes CSV
 *  APPLICATION;ENV;SERVER;STATUS
 */
export type ApplicationStatusRow = {
  application: string;
  env: string;
  server: string;
  status: string;
  sourceFile: string;
};

export async function getApplicationStatusList(): Promise<{
  success: boolean;
  data?: ApplicationStatusRow[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié." };
    }

    if (!fs.existsSync(FILES_DIR)) {
      return {
        success: false,
        error: `Dossier des fichiers introuvable : ${FILES_DIR}.`,
      };
    }

    const allFiles = fs.readdirSync(FILES_DIR);
    const statusFiles = allFiles
      .filter(
        (f) =>
          f.startsWith("appstatus.") &&
          f.endsWith(".txt") &&
          fs.statSync(path.join(FILES_DIR, f)).isFile()
      )
      .sort();

    const rows: ApplicationStatusRow[] = [];

    for (const fileName of statusFiles) {
      const filePath = path.join(FILES_DIR, fileName);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const parts = line.split(";");
        if (parts.length < 4) continue;

        const [application, env, server, status] = parts.map((p) => p.trim());
        if (!application || !env || !server) continue;

        // Ignorer une éventuelle ligne d'en-tête
        if (
          i === 0 &&
          [application, env, server, status].every((v) => {
            const val = v.toLowerCase();
            return (
              val.includes("application") ||
              val.includes("env") ||
              val.includes("serveur") ||
              val.includes("server") ||
              val.includes("status") ||
              val.includes("statut")
            );
          })
        ) {
          continue;
        }

        rows.push({
          application,
          env,
          server,
          status,
          sourceFile: fileName,
        });
      }
    }

    return { success: true, data: rows };
  } catch (error) {
    console.error("[App Status] Erreur lors de la lecture des fichiers:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de la lecture des statuts.",
    };
  }
}

/** Lance le script Unix de refresh des statuts d'applications */
export async function executeAppStatusRefresh() {
  // À adapter côté Unix : script qui génère les fichiers appstatus.*.txt dans FILES_DIR
  const HARPSHELL = "/data/exploit/harpadm/outils/scripts";
  const LOG_DIR = "/data/exploit/harpadm/outils/logs";
  const LOG_FILE = path.join(LOG_DIR, "portail_appstatus_refresh.log");
  const command = `. ~/.profile ; ${HARPSHELL}/refresh_app_status.ksh > ${LOG_FILE} 2>&1`;

  try {
    await execAsync(command, {
      timeout: 5 * 60 * 1000,
      maxBuffer: 4 * 1024 * 1024,
    });
    revalidatePath("/dashboard/statuts-applications");
    return { success: true };
  } catch (err) {
    console.error("[App Status] Erreur lors de l'exécution du script de refresh:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Erreur lors de l'exécution du script de refresh.",
    };
  }
}

