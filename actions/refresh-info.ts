"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Client } from "ssh2";
import * as fs from "fs";

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

