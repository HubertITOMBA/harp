"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Client } from "ssh2";
import * as fs from "fs";
import { join } from "path";
import { z } from "zod";

/**
 * Exécute le script refresh_info.ksh sur le serveur Linux via SSH
 * 
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function executeRefreshInfo() {
  try {
    // Récupérer la session de l'utilisateur
    const session = await auth();
    
    if (!session?.user?.netid) {
      return { 
        success: false, 
        error: "Utilisateur non authentifié. Veuillez vous connecter." 
      };
    }

    const netid = session.user.netid;
    const pkeyfile = session.user.pkeyfile;

    // Récupérer le serveur par défaut depuis la base de données ou utiliser une variable d'environnement
    // On peut utiliser le premier serveur disponible ou un serveur spécifique
    const defaultServer = await db.harpserve.findFirst({
      orderBy: { id: "asc" },
      select: {
        ip: true,
        srv: true,
      }
    });

    if (!defaultServer) {
      return { 
        success: false, 
        error: "Aucun serveur configuré dans la base de données." 
      };
    }

    // Utiliser l'IP du serveur ou le nom du serveur
    const host = defaultServer.ip || defaultServer.srv;
    const port = 22;

    // Variables d'environnement
    const HARPSHELL = "/data/exploit/harpadm/outils/scripts";
    const HARPLOG = "/data/exploit/harpadm/outils/logs";

    // Commande à exécuter
    const command = `. ~/.profile ; ${HARPSHELL}/refresh_info.ksh > ${HARPLOG}/portail_refresh_info.log 2>&1`;

    // Lire la clé SSH privée si disponible
    let privateKey: Buffer | undefined;
    if (pkeyfile && fs.existsSync(pkeyfile)) {
      try {
        privateKey = fs.readFileSync(pkeyfile);
      } catch (error) {
        console.error("Erreur lors de la lecture de la clé SSH:", error);
        return { 
          success: false, 
          error: "Impossible de lire la clé SSH. Vérifiez le chemin de la clé." 
        };
      }
    }

    // Exécuter la commande via SSH
    return new Promise<{ success: boolean; message?: string; error?: string }>((resolve) => {
      const conn = new Client();
      let stdout = "";
      let stderr = "";

      conn.on("ready", () => {
        console.log(`[Refresh Info] Connexion SSH établie avec ${host} pour l'utilisateur ${netid}`);
        
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            resolve({ 
              success: false, 
              error: `Erreur lors de l'exécution de la commande: ${err.message}` 
            });
            return;
          }

          stream.on("close", (code: number, signal: string) => {
            conn.end();
            
            if (code === 0) {
              resolve({ 
                success: true, 
                message: `Script refresh_info.ksh exécuté avec succès sur ${host}. Le log est disponible dans ${HARPLOG}/portail_refresh_info.log` 
              });
            } else {
              resolve({ 
                success: false, 
                error: `Le script s'est terminé avec le code ${code}. Vérifiez le log: ${HARPLOG}/portail_refresh_info.log` 
              });
            }
          });

          stream.on("data", (data: Buffer) => {
            stdout += data.toString();
          });

          stream.stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
          });
        });
      });

      conn.on("error", (err) => {
        console.error("[Refresh Info] Erreur de connexion SSH:", err);
        resolve({ 
          success: false, 
          error: `Erreur de connexion SSH: ${err.message}` 
        });
      });

      // Configuration de la connexion SSH
      const connectConfig: any = {
        host,
        port,
        username: netid,
        readyTimeout: 20000,
      };

      // Ajouter la clé privée si disponible
      if (privateKey) {
        connectConfig.privateKey = privateKey;
      } else {
        // Si pas de clé, utiliser l'authentification par mot de passe (non recommandé)
        // ou retourner une erreur
        resolve({ 
          success: false, 
          error: "Aucune clé SSH configurée. Veuillez configurer votre clé SSH dans votre profil." 
        });
        return;
      }

      conn.connect(connectConfig);
    });

  } catch (error) {
    console.error("[Refresh Info] Erreur:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'exécution du script" 
    };
  } finally {
    revalidatePath("/refresh-info");
  }
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

/**
 * Met à jour les environnements depuis les fichiers CSV sur chaque serveur DB
 * Convertit le script PHP portail_upd_env.php en TypeScript
 * Lit les fichiers depuis chaque serveur DB via SSH (scripts/refreshdb/env.*.txt et release.*.txt)
 * 
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function updateEnvFromFiles() {
  try {
    // Récupérer la session de l'utilisateur
    const session = await auth();
    
    if (!session?.user?.netid) {
      return { 
        success: false, 
        error: "Utilisateur non authentifié. Veuillez vous connecter." 
      };
    }

    const netid = session.user.netid;
    const pkeyfile = session.user.pkeyfile;

    // Récupérer le paramètre ROOTFILE depuis psadm_param
    const rootfileParam = await db.psadm_param.findUnique({
      where: { param: 'ROOTFILE' },
      select: { valeur: true }
    });

    if (!rootfileParam || !rootfileParam.valeur) {
      return { 
        success: false, 
        error: "Le paramètre ROOTFILE n'est pas configuré dans psadm_param." 
      };
    }

    const rootfile = rootfileParam.valeur;
    console.log(`[Update Env From Files] ROOTFILE: ${rootfile}`);

    // Récupérer tous les serveurs DB (serveurs avec typsrv='DB' ou tous les serveurs)
    // On récupère les serveurs uniques depuis harpenvserv où typsrv='DB'
    const dbServers = await db.harpenvserv.findMany({
      where: { typsrv: 'DB' },
      include: { harpserve: true },
      distinct: ['serverId']
    });

    // Si aucun serveur DB trouvé, utiliser tous les serveurs
    const servers = dbServers.length > 0 
      ? dbServers.map(s => s.harpserve).filter(Boolean)
      : await db.harpserve.findMany({
          orderBy: { id: "asc" }
        });

    if (servers.length === 0) {
      return { 
        success: false, 
        error: "Aucun serveur configuré dans la base de données." 
      };
    }

    console.log(`[Update Env From Files] ${servers.length} serveur(s) DB trouvé(s)`);

    // Lire la clé SSH privée
    let privateKey: Buffer | undefined;
    if (pkeyfile && fs.existsSync(pkeyfile)) {
      try {
        privateKey = fs.readFileSync(pkeyfile);
      } catch (error) {
        console.error("Erreur lors de la lecture de la clé SSH:", error);
        return { 
          success: false, 
          error: "Impossible de lire la clé SSH. Vérifiez le chemin de la clé." 
        };
      }
    } else {
      return { 
        success: false, 
        error: "Aucune clé SSH configurée. Veuillez configurer votre clé SSH dans votre profil." 
      };
    }

    let processedFiles = 0;
    let processedEnvs = 0;
    const errors: string[] = [];

    // Traiter chaque serveur DB
    for (const server of servers) {
      if (!server) continue;

      const host = server.ip || server.srv;
      const port = 22;

      console.log(`[Update Env From Files] Traitement du serveur: ${server.srv} (${host})`);

      try {
        // Se connecter au serveur et lire les fichiers
        const result = await processServerFiles(
          host,
          port,
          netid,
          privateKey,
          rootfile,
          (envCount) => {
            processedEnvs += envCount;
          },
          (fileCount) => {
            processedFiles += fileCount;
          },
          (error) => {
            errors.push(`[${server.srv}] ${error}`);
          }
        );

        console.log(`[Update Env From Files] Serveur ${server.srv} traité: ${result.files} fichier(s), ${result.envs} environnement(s)`);
      } catch (error) {
        const errorMsg = `Erreur lors du traitement du serveur ${server.srv}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[Update Env From Files] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const message = `Traitement terminé: ${processedFiles} fichier(s) traité(s) sur ${servers.length} serveur(s), ${processedEnvs} environnement(s) mis à jour.${errors.length > 0 ? ` ${errors.length} erreur(s) rencontrée(s).` : ''}`;
    
    return { 
      success: errors.length === 0, 
      message: errors.length === 0 ? message : `${message} Détails: ${errors.join('; ')}`,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };

  } catch (error) {
    console.error("[Update Env From Files] Erreur:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la mise à jour des environnements" 
    };
  } finally {
    revalidatePath("/refresh-info");
  }
}

/**
 * Traite les fichiers CSV d'un serveur DB via SSH
 */
async function processServerFiles(
  host: string,
  port: number,
  netid: string,
  privateKey: Buffer,
  rootfile: string,
  onEnvProcessed: (count: number) => void,
  onFileProcessed: (count: number) => void,
  onError: (error: string) => void
): Promise<{ files: number; envs: number }> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let processedFiles = 0;
    let processedEnvs = 0;

    conn.on("ready", () => {
      console.log(`[Update Env From Files] Connexion SSH établie avec ${host} pour l'utilisateur ${netid}`);
      
      // Commande pour lister les fichiers env.*.txt et release.*.txt
      const listCommand = `ls -1 ${rootfile}/env.*.txt ${rootfile}/release.*.txt 2>/dev/null || true`;
      
      conn.exec(listCommand, (err, stream) => {
        if (err) {
          conn.end();
          onError(`Erreur lors de la liste des fichiers: ${err.message}`);
          resolve({ files: 0, envs: 0 });
          return;
        }

        let fileList = "";
        
        stream.on("data", (data: Buffer) => {
          fileList += data.toString();
        });

        stream.on("close", async () => {
          const files = fileList.trim().split('\n').filter(f => f.trim() !== '');
          
          if (files.length === 0) {
            conn.end();
            console.log(`[Update Env From Files] Aucun fichier trouvé sur ${host}`);
            resolve({ files: 0, envs: 0 });
            return;
          }

          console.log(`[Update Env From Files] ${files.length} fichier(s) trouvé(s) sur ${host}`);

          // Traiter chaque fichier
          for (const filePath of files) {
            try {
              const envCount = await readAndProcessFile(conn, filePath, rootfile, onError);
              processedEnvs += envCount;
              processedFiles++;
            } catch (error) {
              onError(`Erreur lors du traitement de ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          conn.end();
          onFileProcessed(processedFiles);
          onEnvProcessed(processedEnvs);
          resolve({ files: processedFiles, envs: processedEnvs });
        });

        stream.stderr.on("data", (data: Buffer) => {
          console.error(`[Update Env From Files] stderr: ${data.toString()}`);
        });
      });
    });

    conn.on("error", (err) => {
      console.error(`[Update Env From Files] Erreur de connexion SSH à ${host}:`, err);
      onError(`Erreur de connexion SSH: ${err.message}`);
      resolve({ files: 0, envs: 0 });
    });

    const connectConfig: any = {
      host,
      port,
      username: netid,
      readyTimeout: 20000,
      privateKey,
    };

    conn.connect(connectConfig);
  });
}

/**
 * Lit et traite un fichier CSV depuis le serveur via SSH
 */
async function readAndProcessFile(
  conn: Client,
  filePath: string,
  rootfile: string,
  onError: (error: string) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const fileName = filePath.split('/').pop() || '';
    const isReleaseFile = fileName.startsWith('release.');
    const isEnvFile = fileName.startsWith('env.');
    
    if (!isReleaseFile && !isEnvFile) {
      resolve(0);
      return;
    }

    console.log(`[Update Env From Files] Traitement du fichier: ${fileName}`);

    // Lire le fichier via SSH
    const readCommand = `cat ${filePath}`;
    
    conn.exec(readCommand, (err, stream) => {
      if (err) {
        onError(`Erreur lors de la lecture de ${fileName}: ${err.message}`);
        resolve(0);
        return;
      }

      let fileContent = "";
      
      stream.on("data", (data: Buffer) => {
        fileContent += data.toString();
      });

      stream.on("close", async () => {
        try {
          const lines = fileContent.split('\n').filter(line => line.trim() !== '');
          let envCount = 0;

          if (isReleaseFile) {
            // Fichier release.* : une seule ligne
            if (lines.length > 0) {
              const csvData = parseCsvLine(lines[0]);
              if (csvData && csvData.env) {
                await processEnvData(csvData, onError);
                envCount = 1;
              }
            }
          } else if (isEnvFile) {
            // Fichier env.* : plusieurs lignes (une par environnement)
            for (const line of lines) {
              const csvData = parseCsvLine(line);
              if (csvData && csvData.env) {
                await processEnvData(csvData, onError);
                envCount++;
              }
            }
          }

          console.log(`[Update Env From Files] ${envCount} environnement(s) traité(s) dans ${fileName}`);
          resolve(envCount);
        } catch (error) {
          onError(`Erreur lors du traitement de ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
          resolve(0);
        }
      });

      stream.stderr.on("data", (data: Buffer) => {
        console.error(`[Update Env From Files] stderr pour ${fileName}: ${data.toString()}`);
      });
    });
  });
}

/**
 * Traite les données d'un environnement et met à jour les tables
 */
async function processEnvData(
  data: EnvCsvData,
  onError: (error: string) => void
): Promise<void> {
  try {
    const env = data.env.trim();
    if (!env) {
      return;
    }

    console.log(`[Update Env From Files] Traitement de l'environnement: ${env}`);

    // Traiter la release HARP
    let harprelease = data.harprelease.trim();
    if (!harprelease || harprelease[0] !== 'G') {
      harprelease = 'N/A';
    }

    // Vérifier/créer la release dans releaseenv (équivalent de psadm_release)
    const existingRelease = await db.releaseenv.findUnique({
      where: { harprelease }
    });

    if (!existingRelease) {
      await db.releaseenv.create({
        data: {
          harprelease,
          descr: harprelease
        }
      });
      console.log(`[Update Env From Files] Release créée: ${harprelease}`);
    }

    // Récupérer l'environnement depuis envsharp
    const envRecord = await db.envsharp.findUnique({
      where: { env },
      select: { id: true }
    });

    if (!envRecord) {
      onError(`Environnement ${env} non trouvé dans envsharp`);
      return;
    }

    const envId = envRecord.id;

    // Traiter les valeurs null
    const cobver = data.cobver === 'null' ? 'N/A' : data.cobver.trim();
    const orarelease = data.orarelease === 'null' ? 'N/A' : data.orarelease.trim();
    const ptversion = data.ptversion === 'null' ? 'N/A' : data.ptversion.trim();
    const psversion = data.psversion === 'null' ? 'N/A' : data.psversion.trim();
    const anonym = data.anonym === 'null' ? 'N' : data.anonym.trim();
    const edi = data.edi === 'null' ? 'N' : data.edi.trim();

    // Mettre à jour envsharp
    await db.envsharp.update({
      where: { id: envId },
      data: {
        harprelease,
        volum: cobver,
        ptversion,
        psversion,
        anonym: anonym || 'N',
        edi: edi || 'N',
      }
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

    // Déterminer si c'est un environnement GASSI (mode restreint)
    const isGassiEnv = ['FHHPR1', 'FHFPR1', 'GASSI_PRODUCTION', 'MY_TOOLS', 'FHHPP2', 'FHFPP2'].includes(env);

    if (isGassiEnv) {
      // Mode restreint : seulement datmaj et modetp/modedt
      await db.harpenvinfo.upsert({
        where: { envId },
        create: {
          envId,
          datmaj: infodt || new Date(),
          modetp: modetp || '',
          modedt,
        },
        update: {
          datmaj: infodt || new Date(),
          modetp: modetp || '',
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

    // Mettre à jour deploycbldt et pswd_ft_exploit
    await db.harpenvinfo.update({
      where: { envId },
      data: {
        deploycbldt: deploycbl,
        pswd_ft_exploit,
      }
    });

    // Mettre à jour harpora (Oracle)
    const harporaRecord = await db.harpora.findFirst({
      where: { envId, aliasql: env },
      select: { oracle_sid: true }
    });

    if (harporaRecord) {
      await db.harpora.updateMany({
        where: { 
          oracle_sid: harporaRecord.oracle_sid,
          aliasql: env 
        },
        data: { orarelease }
      });
    }

    // Mettre à jour harpmonitor si infodt est présent
    if (infodt) {
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
    await db.harpenvserv.updateMany({
      where: { envId, typsrv: 'DB' },
      data: { status: dbstatus }
    });

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
          await db.harpenvserv.update({
            where: { id: server.id },
            data: { status }
          });
        }
      }
    } else {
      // Single domain : mettre à jour tous les AS avec asstatus1
      await db.harpenvserv.updateMany({
        where: { envId, typsrv: 'AS' },
        data: { status: asstatus1 }
      });
    }

    // Mettre à jour PRCS UNIX
    // Récupérer les serveurs UNIX depuis harpserve
    const unixServers = await db.harpserve.findMany({
      where: { os: 'UNIX' },
      select: { id: true }
    });

    const unixServerIds = unixServers.map(s => s.id);
    if (unixServerIds.length > 0) {
      await db.harpenvserv.updateMany({
        where: { 
          envId, 
          typsrv: 'PRCS',
          serverId: { in: unixServerIds }
        },
        data: { status: psunxstatus }
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
      await db.harpenvserv.updateMany({
        where: { 
          envId, 
          typsrv: 'PRCS',
          serverId: { in: ntServerIds }
        },
        data: { status: psntstatus }
      });
    }

    // Mettre à jour WS (Web Server)
    await db.harpenvserv.updateMany({
      where: { envId, typsrv: 'WS' },
      data: { status: webstatus }
    });

    console.log(`[Update Env From Files] Environnement ${env} mis à jour avec succès`);
  } catch (error) {
    const errorMsg = `Erreur lors du traitement de l'environnement ${data.env}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Update Env From Files] ${errorMsg}`);
    onError(errorMsg);
  }
}

