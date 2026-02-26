import fs from "fs";
import path from "path";

export type SessionRow = {
  sid: string;
  serial: string;
  username: string;
  schemaname: string;
  osuser: string;
  machine: string;
  module: string;
};

const HEADER =
  "sid;serial#;username;schemaname;osuser;machine;module";

/**
 * Parse le contenu d'un fichier log de sessions Oracle.
 * Cherche la ligne contenant les noms de colonnes puis parse les lignes suivantes (CSV `;`).
 * Ignore les lignes vides et les lignes du type "21 rows selected.".
 */
export function parseSessionsLog(content: string): SessionRow[] {
  const lines = content.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    line.trim().includes(HEADER)
  );
  if (headerIndex === -1) return [];

  const rows: SessionRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^\d+\s*rows?\s*selected\.?$/i.test(line)) break;
    const parts = line.split(";");
    if (parts.length >= 7) {
      rows.push({
        sid: parts[0].trim(),
        serial: parts[1].trim(),
        username: parts[2].trim(),
        schemaname: parts[3].trim(),
        osuser: parts[4].trim(),
        machine: parts[5].trim(),
        module: parts.slice(6).join(";").trim(),
      });
    }
  }
  return rows;
}

/**
 * Lit le fichier save/sessionsLog.LOG (ou sessionsLog.log) et retourne les sessions parsées.
 * Retourne [] si le fichier est absent ou en erreur.
 */
export function getSessionsFromLog(): SessionRow[] {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "save", "sessionsLog.LOG"),
    path.join(cwd, "save", "sessionsLog.log"),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return parseSessionsLog(content);
      }
    } catch {
      // ignorer et essayer le suivant ou retourner []
    }
  }
  return [];
}
