"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Exécute le script refresh_info.ksh en local sur le serveur Node,
 * comme dans la version PHP :
 *   . ~/.profile ; $HARPSHELL/refresh_info.ksh > $HARPLOG/portail_refresh_info.log 2>&1
 * Retourne le statut et, si possible, le contenu du log.
 */
export async function executeRefreshInfo() {
  const HARPSHELL = "/data/exploit/harpadm/outils/scripts";
  const HARPLOG = "/data/exploit/harpadm/outils/logs";
  const LOG_FILE = `${HARPLOG}/portail_refresh_info.log`;
  // const command = `. ~/.profile ; ${HARPSHELL}/refresh_info.ksh > ${LOG_FILE} 2>&1`;
  const command = `. ~/.profile ; ${HARPSHELL}/refresh_info_harp.ksh > ${LOG_FILE} 2>&1`;

  let success = true;
  let errorMessage: string | undefined;

  try {
    await execAsync(command, {
      timeout: 10 * 60 * 1000,
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch (err: unknown) {
    success = false;
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = String(err);
    }
  }

  let log = "";
  try {
    if (fs.existsSync(LOG_FILE)) {
      log = fs.readFileSync(LOG_FILE, "utf-8");
    } else {
      log = `[LOG] Fichier ${LOG_FILE} introuvable.`;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log = `[LOG] Erreur lors de la lecture de ${LOG_FILE}: ${msg}`;
  }

  if (success) {
    return {
      success: true,
      message: "Script refresh_info.ksh exécuté avec succès.",
      log,
    };
  }

  return {
    success: false,
    error: errorMessage || "Erreur lors de l'exécution de refresh_info.ksh.",
    log,
  };
}

/**
 * Interface pour les données CSV d'un environnement
 */
interface EnvCsvData {
  env: string;
  harprelease: string;
  refreshdt: string;
  datadt: string;
  modetp: string;
  modedt: string;
  cobver: string;
  deploycbl: string;
  orarelease: string;
  ptversion: string;
  psversion: string;
  anonym: string;
  infodt: string;
  dbstatus: string;
  nbdom: string;
  asstatus1: string;
  asstatus2: string;
  asstatus3: string;
  asstatus4: string;
  asstatus5: string;
  lastasdt: string;
  psunxstatus: string;
  psunxdt: string;
  psntstatus: string;
  psntdt: string;
  webstatus: string;
  login: string;
  logindt: string;
  pswd_ft_exploit: string;
  edi: string;
}

/**
 * Convertit une chaîne de date MySQL en Date ou null
 */
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === 'null' || dateStr === '' || dateStr.startsWith('0000-00-00')) {
    return null;
  }
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Convertit une chaîne en nombre ou null
 */
function parseNumber(numStr: string | null | undefined): number | null {
  if (!numStr || numStr === 'null' || numStr === '') {
    return null;
  }
  const num = parseInt(numStr, 10);
  return isNaN(num) ? null : num;
}

// harpenvserv.status référence statutenv.id (FK) : ne jamais écrire un id inexistant
const statutenvIdCache = new Map<number, boolean>();
async function isValidStatutenvId(id: number | null): Promise<boolean> {
  if (id === null) return false;
  if (statutenvIdCache.has(id)) return statutenvIdCache.get(id)!;
  const existing = await db.statutenv.findUnique({ where: { id }, select: { id: true } });
  const ok = Boolean(existing);
  statutenvIdCache.set(id, ok);
  return ok;
}

async function safeUpdateHarpenvservStatusMany(params: {
  where: Parameters<typeof db.harpenvserv.updateMany>[0]["where"];
  status: number | null;
}): Promise<void> {
  const { where, status } = params;
  if (!(await isValidStatutenvId(status))) return;
  await db.harpenvserv.updateMany({ where, data: { status } });
}

async function safeUpdateHarpenvservStatusOne(params: { id: number; status: number | null }): Promise<void> {
  const { id, status } = params;
  if (!(await isValidStatutenvId(status))) return;
  await db.harpenvserv.update({ where: { id }, data: { status } });
}

/**
 * Parse une ligne CSV avec séparateur ';'
 */
function parseCsvLine(line: string): EnvCsvData | null {
  const parts = line.split(';');
  if (parts.length < 30) {
    return null;
  }
  return {
    env: parts[0] || '',
    harprelease: parts[1] || '',
    refreshdt: parts[2] || '',
    datadt: parts[3] || '',
    modetp: parts[4] || '',
    modedt: parts[5] || '',
    cobver: parts[6] || '',
    deploycbl: parts[7] || '',
    orarelease: parts[8] || '',
    ptversion: parts[9] || '',
    psversion: parts[10] || '',
    anonym: parts[11] || '',
    infodt: parts[12] || '',
    dbstatus: parts[13] || '',
    nbdom: parts[14] || '',
    asstatus1: parts[15] || '',
    asstatus2: parts[16] || '',
    asstatus3: parts[17] || '',
    asstatus4: parts[18] || '',
    asstatus5: parts[19] || '',
    lastasdt: parts[20] || '',
    psunxstatus: parts[21] || '',
    psunxdt: parts[22] || '',
    psntstatus: parts[23] || '',
    psntdt: parts[24] || '',
    webstatus: parts[25] || '',
    login: parts[26] || '',
    logindt: parts[27] || '',
    pswd_ft_exploit: parts[28] || '',
    edi: parts[29] || '',
  };
}

/** Dossier des fichiers générés par refresh_info_harp.ksh (env.*, release.*) */
const FILES_DIR =
  process.env.PORTAL_HARP_FILES ||
  (process.platform === "win32"
    ? "C:\\produits\\portail_harp\\files"
    : "/produits/portail_harp/files");

/** Fichier de log pour le diagnostic de la mise à jour env.* / release.* (même dossier que les fichiers, lisible par les utilisateurs) */
const REFRESH_UPDATE_LOG_PATH = path.join(FILES_DIR, "refresh-info-update.log");

function clearRefreshUpdateLog(): void {
  try {
    const stamp = new Date().toISOString();
    fs.writeFileSync(REFRESH_UPDATE_LOG_PATH, `[${stamp}] Début du log de mise à jour.\n`, "utf-8");
  } catch (err) {
    console.error("[refresh-info] Impossible d'écrire le log:", err);
  }
}

function appendRefreshUpdateLog(line: string): void {
  try {
    const stamp = new Date().toISOString();
    fs.appendFileSync(REFRESH_UPDATE_LOG_PATH, `[${stamp}] ${line}\n`, "utf-8");
  } catch (err) {
    console.error("[refresh-info] Impossible d'écrire le log:", err);
  }
}

export type UpdateEnvFromFilesResult = {
  success: boolean;
  message?: string;
  error?: string;
  addedReleases?: string[];
  updatedEnvs?: string[];
};

/**
 * Retourne la liste des fichiers env.* à traiter (pour mise à jour fichier par fichier côté client).
 */
export async function getEnvUpdateFileList(): Promise<
  { success: true; envFiles: string[] } | { success: false; error: string }
> {
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
    const envFiles = allFiles
      .filter(
        (f) =>
          f.startsWith("env.") &&
          f.endsWith(".txt") && // ignorer les sauvegardes type .txt.bak
          fs.statSync(path.join(FILES_DIR, f)).isFile()
      )
      .sort();
    return { success: true, envFiles };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  }
}

/**
 * Retourne la liste des fichiers release.* à traiter (après les env.*).
 */
export async function getReleaseUpdateFileList(): Promise<
  { success: true; releaseFiles: string[] } | { success: false; error: string }
> {
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
    const releaseFiles = allFiles
      .filter(
        (f) =>
          f.startsWith("release.") &&
          f.endsWith(".txt") &&
          fs.statSync(path.join(FILES_DIR, f)).isFile()
      )
      .sort();
    return { success: true, releaseFiles };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  }
}

/**
 * Traite un seul fichier env.* et met à jour envsharp pour les environnements déjà présents.
 * Les env présents dans le fichier mais absents d'envsharp sont ignorés (mise à jour uniquement).
 * @param startNewLog - Si true, écrase le fichier de log avant de traiter (début de batch).
 */
export async function processOneEnvFile(fileName: string, options?: { startNewLog?: boolean }): Promise<UpdateEnvFromFilesResult> {
  try {
    const session = await auth();
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié." };
    }
    if (!fileName.startsWith("env.")) {
      return { success: false, error: `Fichier invalide : ${fileName}` };
    }
    const filePath = path.join(FILES_DIR, fileName);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return { success: false, error: `Fichier introuvable : ${fileName}` };
    }

    if (options?.startNewLog) {
      clearRefreshUpdateLog();
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
    appendRefreshUpdateLog("---");
    appendRefreshUpdateLog(`Fichier lu: ${fileName} | Nombre de lignes: ${lines.length}`);

    const errors: string[] = [];
    const addedReleases: string[] = [];
    const updatedEnvs: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const csvData = parseCsvLine(lines[i]!);
      if (!csvData?.env?.trim()) continue;
      if (csvData.env.trim().toLowerCase() === "env") continue; // ligne d'en-tête

      const result = await processEnvData(csvData);
      const env = csvData.env.trim();
      const harprelease = (csvData.harprelease || "").trim() || "N/A";
      const confirmation = result.error
        ? `erreur: ${result.error}`
        : result.updated
          ? "ligne traitée (env mis à jour)"
          : "ligne ignorée (env absent d'envsharp)";
      appendRefreshUpdateLog(`  env=${env} | harprelease=${harprelease} | ${confirmation}`);

      if (result.error) errors.push(result.error);
      if (result.addedReleases.length) addedReleases.push(...result.addedReleases);
      if (result.updated && result.env) updatedEnvs.push(result.env);
    }

    const message = `${updatedEnvs.length} environnement(s) mis à jour dans ${fileName}.`;
    return {
      success: errors.length === 0,
      message,
      error: errors.length > 0 ? errors.join(" ; ") : undefined,
      addedReleases: addedReleases.length > 0 ? addedReleases : undefined,
      updatedEnvs: updatedEnvs.length > 0 ? updatedEnvs : undefined,
    };
  } catch (error) {
    console.error("[Process One Env File] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  } finally {
    revalidatePath("/refresh-info");
  }
}

/**
 * Traite un seul fichier release.* (même format CSV que env.*, mais sans harpora/harpmonitor et avec lastcheckstatus en fin de lot).
 */
export async function processOneReleaseFile(fileName: string): Promise<UpdateEnvFromFilesResult> {
  try {
    const session = await auth();
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié." };
    }
    if (!fileName.startsWith("release.")) {
      return { success: false, error: `Fichier invalide : ${fileName}` };
    }
    const filePath = path.join(FILES_DIR, fileName);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return { success: false, error: `Fichier introuvable : ${fileName}` };
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
    appendRefreshUpdateLog("---");
    appendRefreshUpdateLog(`Fichier lu: ${fileName} | Nombre de lignes: ${lines.length}`);

    const errors: string[] = [];
    const addedReleases: string[] = [];
    const updatedEnvs: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const csvData = parseCsvLine(lines[i]!);
      if (!csvData?.env?.trim()) continue;
      if (csvData.env.trim().toLowerCase() === "env") continue; // ligne d'en-tête

      const result = await processEnvData(csvData, { isRelease: true });
      const env = csvData.env.trim();
      const harprelease = (csvData.harprelease || "").trim() || "N/A";
      const confirmation = result.error
        ? `erreur: ${result.error}`
        : result.updated
          ? "ligne traitée (env mis à jour)"
          : "ligne ignorée (env absent d'envsharp)";
      appendRefreshUpdateLog(`  env=${env} | harprelease=${harprelease} | ${confirmation}`);

      if (result.error) errors.push(result.error);
      if (result.addedReleases.length) addedReleases.push(...result.addedReleases);
      if (result.updated && result.env) updatedEnvs.push(result.env);
    }

    const message = `${updatedEnvs.length} environnement(s) mis à jour (release) dans ${fileName}.`;
    return {
      success: errors.length === 0,
      message,
      error: errors.length > 0 ? errors.join(" ; ") : undefined,
      addedReleases: addedReleases.length > 0 ? addedReleases : undefined,
      updatedEnvs: updatedEnvs.length > 0 ? updatedEnvs : undefined,
    };
  } catch (error) {
    console.error("[Process One Release File] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  } finally {
    revalidatePath("/refresh-info");
  }
}

/**
 * Applique l'étape 13 : met à jour harpenvinfo.lastcheckstatus = 1 pour les (envId, datmaj)
 * dont la dernière ligne harpmonitor indique un statut OK (dbstatus=0 ou asstatus=0 ou prcsunx/nt=0).
 * À appeler après le traitement de tous les fichiers release.*.
 */
export async function applyLastCheckStatus(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié." };
    }

    const monitors = await db.harpmonitor.findMany({
      orderBy: { monitordt: "desc" },
      select: {
        envId: true,
        monitordt: true,
        dbstatus: true,
        nbdom: true,
        asstatus1: true,
        asstatus2: true,
        asstatus3: true,
        asstatus4: true,
        asstatus5: true,
        prcsunxstatus: true,
        prcsntstatus: true,
      },
    });

    const latestByEnv = new Map<number, (typeof monitors)[0]>();
    for (const m of monitors) {
      if (!latestByEnv.has(m.envId)) {
        latestByEnv.set(m.envId, m);
      }
    }

    let updated = 0;
    for (const m of latestByEnv.values()) {
      const ok =
        m.dbstatus === 0 ||
        (m.nbdom === 1 && m.asstatus1 === 0) ||
        (m.nbdom === 2 && (m.asstatus1 === 0 || m.asstatus2 === 0)) ||
        (m.nbdom === 3 && (m.asstatus1 === 0 || m.asstatus2 === 0 || m.asstatus3 === 0)) ||
        (m.nbdom === 4 && (m.asstatus1 === 0 || m.asstatus2 === 0 || m.asstatus3 === 0 || m.asstatus4 === 0)) ||
        (m.nbdom === 5 &&
          (m.asstatus1 === 0 || m.asstatus2 === 0 || m.asstatus3 === 0 || m.asstatus4 === 0 || m.asstatus5 === 0)) ||
        m.prcsunxstatus === 0 ||
        m.prcsntstatus === 0;

      if (ok) {
        const r = await db.harpenvinfo.updateMany({
          where: { envId: m.envId, datmaj: m.monitordt },
          data: { lastcheckstatus: 1 },
        });
        updated += r.count;
      }
    }

    console.log(`[Apply Last Check Status] ${updated} enregistrement(s) harpenvinfo avec lastcheckstatus=1`);
    return { success: true };
  } catch (error) {
    console.error("[Apply Last Check Status] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  } finally {
    revalidatePath("/refresh-info");
  }
}

/**
 * Met à jour la base depuis les fichiers locaux env.* (générés par refresh_info_harp.ksh).
 * Ne traite que les environnements déjà présents dans envsharp.
 */
export async function updateEnvFromFiles(): Promise<UpdateEnvFromFilesResult> {
  try {
    const list = await getEnvUpdateFileList();
    if (!list.success) return { success: false, error: list.error };

    clearRefreshUpdateLog();
    const errors: string[] = [];
    const addedReleases: string[] = [];
    const updatedEnvs: string[] = [];
    let processedEnvs = 0;

    for (const fileName of list.envFiles) {
      const result = await processOneEnvFile(fileName);
      if (result.updatedEnvs) {
        updatedEnvs.push(...result.updatedEnvs);
        processedEnvs += result.updatedEnvs.length;
      }
      if (result.addedReleases) addedReleases.push(...result.addedReleases);
      if (result.error) errors.push(result.error);
    }

    const message = `Traitement terminé : ${processedEnvs} environnement(s) mis à jour (envsharp).${addedReleases.length ? ` ${addedReleases.length} release(s) ajoutée(s) dans releaseenv.` : ""}${errors.length ? ` ${errors.length} erreur(s).` : ""}`;

    return {
      success: errors.length === 0,
      message,
      error: errors.length > 0 ? errors.join(" ; ") : undefined,
      addedReleases: addedReleases.length > 0 ? addedReleases : undefined,
      updatedEnvs: updatedEnvs.length > 0 ? updatedEnvs : undefined,
    };
  } catch (error) {
    console.error("[Update Env From Files] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la mise à jour.",
    };
  } finally {
    revalidatePath("/refresh-info");
  }
}

/**
 * Traite les données d'un environnement et met à jour les tables (harpenvinfo, harpora, etc.).
 * @param data - Ligne CSV parsée
 * @param options.isRelease - Si true (fichier release.*), on ne met à jour ni harpora ni harpmonitor, et on applique les null→N/A pour orarelease/ptversion/psversion
 */
async function processEnvData(
  data: EnvCsvData,
  options: { isRelease?: boolean } = {}
): Promise<{ updated: boolean; env?: string; addedReleases: string[]; error?: string }> {
  const isRelease = options.isRelease === true;
  const addedReleases: string[] = [];
  try {
    const env = data.env.trim();
    if (!env) {
      return { updated: false, addedReleases: [] };
    }

    console.log(`[Update Env From Files] Traitement de l'environnement: ${env}`);

    // Récupérer l'environnement depuis envsharp
    const envRecord = await db.envsharp.findUnique({
      where: { env },
      select: { id: true }
    });

    if (!envRecord) {
      // Mise à jour uniquement : ignorer les env absents d'envsharp
      return { updated: false, env, addedReleases: [] };
    }

    const envId = envRecord.id;
    console.log(`[Update Env From Files] env=${env} -> envId=${envId} récupéré depuis envsharp`);

    // Traiter la release HARP (uniquement si env existe)
    let harprelease = data.harprelease.trim();
    if (!harprelease || harprelease[0] !== "G") {
      harprelease = "N/A";
    } else {
      const existingRelease = await db.releaseenv.findUnique({
        where: { harprelease },
      });
      if (!existingRelease) {
        await db.releaseenv.create({
          data: { harprelease, descr: harprelease },
        });
        addedReleases.push(harprelease);
        console.log(`[Update Env From Files] Release créée: ${harprelease}`);
      }
    }

    // Traiter les valeurs null
    const cobverRaw = data.cobver === "null" ? "N/A" : data.cobver.trim();
    const volum = cobverRaw.slice(0, 60);
    const orarelease = data.orarelease === "null" ? "N/A" : data.orarelease.trim();
    const ptversion = data.ptversion === "null" ? "N/A" : data.ptversion.trim();
    const psversion = data.psversion === "null" ? "N/A" : data.psversion.trim();
    const anonym = data.anonym === "null" ? "N" : (data.anonym.trim() || "N");
    const edi = data.edi === "null" ? "N" : (data.edi.trim() || "N");

    // Mettre à jour envsharp (tracer l'ancienne et la nouvelle valeur de harprelease)
    const beforeEnv = await db.envsharp.findUnique({
      where: { id: envId },
      select: { harprelease: true },
    });
    console.log(
      `[Update Env From Files] env=${env} (id=${envId}) harprelease avant='${beforeEnv?.harprelease ?? "NULL"}', après='${harprelease}'`
    );

    await db.envsharp.update({
      where: { id: envId },
      data: {
        harprelease,
        volum,
        ptversion,
        psversion,
        anonym,
        edi,
      },
    });

    // Mettre à jour edi pour FHHPR1 et GASSI_PRODUCTION
    if (env === 'FHHPR1' || env === 'GASSI_PRODUCTION') {
      await db.envsharp.update({
        where: { id: envId },
        data: { edi: 'O' }
      });
    }

    // Mettre à jour harpenvinfo
    const refreshdt = parseDate(data.refreshdt);
    const datadt = parseDate(data.datadt);
    const modetp = data.modetp === 'null' ? null : data.modetp.trim();
    const modedt = parseDate(data.modedt);
    const infodt = parseDate(data.infodt);
    const deploycbl = data.deploycbl === 'null' ? null : data.deploycbl.trim();
    const pswd_ft_exploit = data.pswd_ft_exploit === 'null' ? null : data.pswd_ft_exploit.trim();

    // harpenvinfo est liée à envsharp par envId ; le nom d'env (FHHPR1, GASSI_PRODUCTION, etc.) est dans envsharp.env.
    // GASSI = mode restreint (datmaj + modetp/modedt) ; non-GASSI = datmaj + refreshdt + datadt.
    const isGassiEnv = ['FHHPR1', 'FHFPR1', 'GASSI_PRODUCTION', 'GASSI_DEV', 'MY_TOOLS', 'FHHPP2', 'FHFPP2'].includes(env);

    if (isGassiEnv) {
      // Environnements GASSI : datmaj + modetp/modedt (modedt vide si modetp null, comme en PHP)
      await db.harpenvinfo.upsert({
        where: { envId },
        create: {
          envId,
          datmaj: infodt || new Date(),
          modetp: modetp ?? '',
          modedt,
        },
        update: {
          datmaj: infodt || new Date(),
          modetp: modetp ?? '',
          modedt,
        }
      });
    } else {
      // Environnements non production : datmaj, refreshdt, datadt
      await db.harpenvinfo.upsert({
        where: { envId },
        create: {
          envId,
          datmaj: infodt || new Date(),
          refreshdt,
          datadt,
        },
        update: {
          datmaj: infodt || new Date(),
          refreshdt,
          datadt,
        }
      });
    }

    // Mettre à jour deploycbldt, pswd_ft_exploit, refreshdt et datadt pour tous (env.* et release.*)
    await db.harpenvinfo.update({
      where: { envId },
      data: {
        deploycbldt: deploycbl,
        pswd_ft_exploit,
        refreshdt,
        datadt,
      }
    });

    // Mettre à jour harpora (Oracle) — uniquement pour les fichiers env.*, pas release.*
    if (!isRelease) {
      const harporaRecord = await db.harpora.findFirst({
        where: { envId, aliasql: env },
        select: { oracle_sid: true }
      });

      if (harporaRecord) {
        console.log(
          `[Update Env From Files] harpora pour env=${env}, envId=${envId}, oracle_sid=${harporaRecord.oracle_sid}`
        );
        await db.harpora.updateMany({
          where: { envId, aliasql: env },
          data: { orarelease },
        });
      }
    }

    // Mettre à jour harpmonitor si infodt est présent — uniquement pour les fichiers env.*, pas release.*
    if (!isRelease && infodt) {
      const dbstatus = parseNumber(data.dbstatus);
      const nbdom = parseNumber(data.nbdom);
      const asstatus1 = parseNumber(data.asstatus1);
      const asstatus2 = parseNumber(data.asstatus2);
      const asstatus3 = parseNumber(data.asstatus3);
      const asstatus4 = parseNumber(data.asstatus4);
      const asstatus5 = parseNumber(data.asstatus5);
      const lastasdt = parseDate(data.lastasdt);
      const prcsunxstatus = parseNumber(data.psunxstatus);
      const lastprcsunxdt = parseDate(data.psunxdt);
      const prcsntstatus = parseNumber(data.psntstatus);
      const lastprcsntdt = parseDate(data.psntdt);
      const lastlogin = data.login === 'null' ? null : data.login.trim();
      const lastlogindt = parseDate(data.logindt);

      // Vérifier si l'enregistrement existe déjà
      const existingMonitor = await db.harpmonitor.findFirst({
        where: {
          envId,
          monitordt: infodt
        }
      });

      if (!existingMonitor) {
        await db.harpmonitor.create({
          data: {
            envId,
            monitordt: infodt,
            dbstatus,
            nbdom,
            asstatus1,
            asstatus2,
            asstatus3,
            asstatus4,
            asstatus5,
            lastasdt,
            prcsunxstatus,
            lastprcsunxdt,
            prcsntstatus,
            lastprcsntdt,
            lastlogin,
            lastlogindt,
          }
        });
      }
    }

    // Mettre à jour harpenvserv (statuts des services)
    const dbstatus = parseNumber(data.dbstatus);
    const nbdom = parseNumber(data.nbdom);
    const asstatus1 = parseNumber(data.asstatus1);
    const asstatus2 = parseNumber(data.asstatus2);
    const asstatus3 = parseNumber(data.asstatus3);
    const asstatus4 = parseNumber(data.asstatus4);
    const asstatus5 = parseNumber(data.asstatus5);
    const psunxstatus = parseNumber(data.psunxstatus);
    const psntstatus = parseNumber(data.psntstatus);
    const webstatus = parseNumber(data.webstatus);

    // Mettre à jour le statut DB
    await safeUpdateHarpenvservStatusMany({ where: { envId, typsrv: 'DB' }, status: dbstatus });

    // Mettre à jour les statuts AS
    if (nbdom && nbdom > 1) {
      // Multi-domaines : mettre à jour AS1, AS2, AS3, AS4, AS5 selon le serveur
      const servers = await db.harpenvserv.findMany({
        where: { envId, typsrv: 'AS' },
        include: { harpserve: true }
      });

      for (const server of servers) {
        const srvName = server.harpserve?.srv || '';
        const lastChar = srvName.slice(-1);
        let status: number | null = null;

        if (lastChar === '1') status = asstatus1;
        else if (lastChar === '2') status = asstatus2;
        else if (lastChar === '3') status = asstatus3;
        else if (lastChar === '4') status = asstatus4;
        else if (lastChar === '5') status = asstatus5;

        if (status !== null && server.id) {
          await safeUpdateHarpenvservStatusOne({ id: server.id, status });
        }
      }
    } else {
      // Single domain : mettre à jour tous les AS avec asstatus1
      await safeUpdateHarpenvservStatusMany({ where: { envId, typsrv: 'AS' }, status: asstatus1 });
    }

    // Mettre à jour PRCS UNIX/LINUX
    const unixServers = await db.harpserve.findMany({
      where: { os: { in: ["LINUX", "UNIX"] } },
      select: { id: true }
    });

    const unixServerIds = unixServers.map(s => s.id);
    if (unixServerIds.length > 0) {
      await safeUpdateHarpenvservStatusMany({
        where: { envId, typsrv: 'PRCS', serverId: { in: unixServerIds } },
        status: psunxstatus
      });
    }

    // Mettre à jour PRCS NT
    // Récupérer les serveurs NT depuis harpserve
    const ntServers = await db.harpserve.findMany({
      where: { os: 'NT' },
      select: { id: true }
    });

    const ntServerIds = ntServers.map(s => s.id);
    if (ntServerIds.length > 0) {
      await safeUpdateHarpenvservStatusMany({
        where: { envId, typsrv: 'PRCS', serverId: { in: ntServerIds } },
        status: psntstatus
      });
    }

    // Mettre à jour WS (Web Server)
    await safeUpdateHarpenvservStatusMany({ where: { envId, typsrv: 'WS' }, status: webstatus });

    console.log(`[Update Env From Files] Environnement ${env} mis à jour avec succès`);
  } catch (error) {
    const errorMsg = `Erreur lors du traitement de l'environnement ${data.env}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(`[Update Env From Files] ${errorMsg}`);
    return { updated: false, env: data.env?.trim(), addedReleases: [], error: errorMsg };
  }
  return { updated: true, env: data.env.trim(), addedReleases, };
}

