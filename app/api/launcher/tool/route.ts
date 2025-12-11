import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * API endpoint pour récupérer les informations d'un outil depuis la base de données
 * Utilisé par launcher.ps1 pour obtenir dynamiquement les chemins et arguments
 * 
 * GET /api/launcher/tool?tool=putty&netid=USER123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tool = searchParams.get("tool");
    const netid = searchParams.get("netid");
    // Paramètres optionnels pour construire les arguments dynamiquement
    const ptversion = searchParams.get("ptversion");
    const aliasql = searchParams.get("aliasql");
    const envId = searchParams.get("envId");
    const ip = searchParams.get("ip");

    if (!tool) {
      return NextResponse.json(
        { error: "Le paramètre 'tool' est requis" },
        { status: 400 }
      );
    }

    if (!netid) {
      return NextResponse.json(
        { error: "Le paramètre 'netid' est requis" },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'outil depuis harptools
    const toolInfo = await db.harptools.findFirst({
      where: { tool: tool },
      select: {
        tool: true,
        cmdpath: true,
        cmd: true,
        cmdarg: true,
        descr: true,
        version: true, // Récupérer la version pour construire dynamiquement le chemin
      },
    });

    if (!toolInfo) {
      return NextResponse.json(
        { error: `Outil '${tool}' non trouvé dans la base de données` },
        { status: 404 }
      );
    }

    // Récupérer la clé SSH de l'utilisateur depuis User
    const user = await db.user.findUnique({
      where: { netid: netid },
      select: {
        pkeyfile: true,
      },
    });

    // Construire le chemin complet de l'exécutable
    // TOUS les outils doivent utiliser cmd de harptools
    let fullPath = "";
    if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
      return NextResponse.json(
        { error: `L'outil '${tool}' n'a pas de commande (cmd) définie dans la base de données` },
        { status: 400 }
      );
    }

    // Récupérer cmd de harptools (obligatoire pour tous les outils)
    const cmd = toolInfo.cmd.trim();

    // Pour psdmt et pside, construire dynamiquement le chemin selon la version
    // Priorité : ptversion depuis les paramètres > version depuis harptools
    const versionToUse = ptversion || toolInfo.version;
    
    if ((tool === "psdmt" || tool === "pside") && versionToUse) {
      // Convertir la version (ex: "8.60" -> "pt860", "8.61" -> "pt861")
      const versionStr = versionToUse.trim();
      const ptVersion = versionStr.replace(/\./g, ""); // Remplacer les points par rien
      const basePath = `D:\\apps\\peoplesoft\\pt${ptVersion}\\bin\\client\\winx86`;
      // Utiliser cmd de harptools
      fullPath = `${basePath}\\${cmd}`;
    } else if (toolInfo.cmdpath && toolInfo.cmdpath.trim() !== "") {
      // Pour les autres outils, utiliser cmdpath + cmd de harptools
      const cmdpath = toolInfo.cmdpath.trim().replace(/\\$/, ""); // Enlever le \ final s'il existe
      // Utiliser cmd de harptools
      fullPath = `${cmdpath}\\${cmd}`;
    } else {
      // Sinon, utiliser seulement cmd de harptools (qui peut être un chemin complet)
      fullPath = cmd;
    }

    // Normaliser les backslashes pour Windows
    fullPath = fullPath.replace(/\//g, "\\");

    // Construire les arguments dynamiquement selon l'outil
    let dynamicArgs = toolInfo.cmdarg || "";
    
    if (tool === "psdmt" || tool === "pside") {
      // Pour psdmt et pside : -CT ORACLE -CD {aliasql}
      if (aliasql) {
        dynamicArgs = `-CT ORACLE -CD ${aliasql}`;
      } else if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    } else if (tool === "filezilla") {
      // Pour filezilla : sftp: {netid}@{ip} -p 22
      if (ip && netid) {
        dynamicArgs = `sftp: ${netid}@${ip} -p 22`;
      } else if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    } else if (tool === "putty") {
      // Pour putty : les arguments sont construits par le launcher PowerShell
      // L'API retourne juste cmdarg de la base de données si disponible
      // Le launcher PowerShell construit les arguments avec -P, -i, et host depuis l'URL
      if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    } else if (tool === "sqlplus") {
      // Pour sqlplus : /@ {aliasql}
      if (aliasql) {
        dynamicArgs = `/@ ${aliasql}`;
      } else if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    }

    return NextResponse.json({
      success: true,
      tool: toolInfo.tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: dynamicArgs, // Arguments construits dynamiquement
      descr: toolInfo.descr,
      version: versionToUse || toolInfo.version || null, // Inclure la version dans la réponse pour le debugging
      pkeyfile: user?.pkeyfile || null,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'outil:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des informations" },
      { status: 500 }
    );
  }
}
