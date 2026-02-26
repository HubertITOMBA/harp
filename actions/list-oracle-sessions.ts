"use server";

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { parseSessionsLog } from "@/lib/parse-sessions-log";
import type { SessionRow } from "@/lib/parse-sessions-log";

const execAsync = promisify(exec);

const PROFILE_PATH = "/home/psadm/.profile";
const PORTAIL_SCRIPT = "/data/exploit/harpadm/outils/scripts/portail_ssh.ksh";
const LOGS_DIR = "/data/exploit/harpadm/outils/logs";
const REMOTE_SCRIPT = "kill_ora_session.ksh";
const SSH_USER = "psoft";
const TIMEOUT_MS = 90_000;

export type ListOracleSessionsResult =
  | { success: true; sessions: SessionRow[] }
  | { success: false; error: string; sessions?: SessionRow[] };

/**
 * Exécute côté serveur : source du profil psadm puis portail_ssh.ksh
 * pour lister les sessions Oracle sur la cible psoft@ip.
 * Lit le log généré dans LOGS_DIR et retourne les sessions parsées.
 */
export async function listOracleSessions(
  oracleSid: string,
  ip: string,
): Promise<ListOracleSessionsResult> {
  const sid = (oracleSid || "").trim();
  const targetIp = (ip || "").trim();
  if (!sid || !targetIp) {
    return { success: false, error: "oracle_sid et ip sont requis." };
  }

  // La commande distante doit être passée entre "" (ex: portail_ssh.ksh psoft@ip "kill_ora_session.ksh -i SID -v")
  // exec 2>&1 : évite "tee: /dev/stderr: No such device" quand le process n'a pas de TTY (ex. Node child_process)
  const remoteCmd = `${REMOTE_SCRIPT} -i ${sid} -v`;
  const cmd = `bash -c 'exec 2>&1; . ${PROFILE_PATH} 2>/dev/null; ${PORTAIL_SCRIPT} ${SSH_USER}@${targetIp} "${remoteCmd}"'`;

  // Log temporaire vers la console pour lire les erreurs (toast tronque le message)
  console.error("[listOracleSessions] Commande exécutée:", cmd);

  try {
    await execAsync(cmd, {
      timeout: TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
    });
  } catch (err: unknown) {
    const ex = err as { message?: string; stdout?: string; stderr?: string };
    const message = ex?.message ?? (err instanceof Error ? err.message : String(err));
    console.error("[listOracleSessions] ERREUR exécution:", message);
    if (ex?.stdout) console.error("[listOracleSessions] stdout:", ex.stdout);
    if (ex?.stderr) console.error("[listOracleSessions] stderr:", ex.stderr);
    return {
      success: false,
      error: `Exécution du script : ${message}`,
      sessions: [],
    };
  }

  let sessions: SessionRow[] = [];
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return {
        success: false,
        error: `Répertoire des logs introuvable : ${LOGS_DIR}`,
        sessions: [],
      };
    }
    const files = fs.readdirSync(LOGS_DIR);
    const withStat = files
      .map((f) => ({
        name: f,
        path: path.join(LOGS_DIR, f),
        mtime: 0,
      }))
      .filter((f) => fs.statSync(f.path).isFile())
      .map((f) => ({ ...f, mtime: fs.statSync(f.path).mtime.getTime() }));
    withStat.sort((a, b) => b.mtime - a.mtime);
    const latest = withStat[0];
    if (!latest) {
      return { success: true, sessions: [] };
    }
    const content = fs.readFileSync(latest.path, "utf-8");
    sessions = parseSessionsLog(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[listOracleSessions] ERREUR lecture log:", message);
    return {
      success: false,
      error: `Lecture du log : ${message}`,
      sessions: [],
    };
  }

  return { success: true, sessions };
}
