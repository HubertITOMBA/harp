import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildPeopleSoftClientPath,
  normalizePeopleToolsVersion,
} from "@/lib/ptools-path";

const PEOPLESOFT_CLIENT_TOOLS = new Set(["pside", "psdmt"]);

/**
 * API endpoint pour récupérer les informations d'un outil depuis la base de données
 * Utilisé par launcher.ps1 pour obtenir dynamiquement les chemins et arguments
 *
 * GET /api/launcher/tool?tool=putty&netid=USER123
 * Pour pside/psdmt : ptversion (ex. 8.61) est obligatoire et détermine pt861, pt862, …
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tool = searchParams.get("tool");
    const netid = searchParams.get("netid");
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

    const toolInfo = await db.harptools.findFirst({
      where: { tool: tool },
      select: {
        tool: true,
        cmdpath: true,
        cmd: true,
        cmdarg: true,
        descr: true,
        version: true,
      },
    });

    if (!toolInfo) {
      return NextResponse.json(
        { error: `Outil '${tool}' non trouvé dans la base de données` },
        { status: 404 }
      );
    }

    const user = await db.user.findUnique({
      where: { netid: netid },
      select: {
        pkeyfile: true,
      },
    });

    if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
      return NextResponse.json(
        {
          error: `L'outil '${tool}' n'a pas de commande (cmd) définie dans la base de données`,
        },
        { status: 400 }
      );
    }

    const cmd = toolInfo.cmd.trim();
    let fullPath = "";
    let versionToUse: string | null = null;
    let ptFolder: string | null = null;

    if (PEOPLESOFT_CLIENT_TOOLS.has(tool)) {
      // Source de vérité : ptversion de l'environnement (pas de fallback silencieux vers une autre version)
      const normalized = normalizePeopleToolsVersion(ptversion);
      if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      versionToUse = normalized.display;
      ptFolder = `pt${normalized.folderSuffix}`;

      // Sécurité : l'exe est imposé par le tool, pas par harptools.cmd (évite un cmd arbitraire en BDD)
      if (tool !== "pside" && tool !== "psdmt") {
        return NextResponse.json(
          { error: `Outil PeopleSoft non supporté: ${tool}` },
          { status: 400 }
        );
      }
      fullPath = buildPeopleSoftClientPath(tool, normalized.folderSuffix);
    } else if (toolInfo.cmdpath && toolInfo.cmdpath.trim() !== "") {
      const cmdpath = toolInfo.cmdpath.trim().replace(/\\$/, "");
      fullPath = `${cmdpath}\\${cmd}`;
    } else {
      fullPath = cmd;
    }

    fullPath = fullPath.replace(/\//g, "\\");

    let dynamicArgs = toolInfo.cmdarg || "";

    if (tool === "psdmt" || tool === "pside") {
      if (aliasql && aliasql.trim() !== "") {
        dynamicArgs = `-CT ORACLE -CD ${aliasql.trim()}`;
      } else {
        dynamicArgs = "";
      }
    } else if (tool === "filezilla") {
      if (ip && netid) {
        let sftpUrl = `sftp://${netid}@${ip}:22/`;
        if (user?.pkeyfile?.trim()) {
          const keyfile = user.pkeyfile.trim().replace(/\\/g, "/");
          sftpUrl += `?keyfile=${keyfile}`;
        }
        dynamicArgs = sftpUrl;
      } else if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    } else if (tool === "putty") {
      if (toolInfo.cmdarg && toolInfo.cmdarg.trim() !== "") {
        dynamicArgs = toolInfo.cmdarg;
      }
    } else if (tool === "sqlplus") {
      if (aliasql && aliasql.trim() !== "") {
        dynamicArgs = `/@${aliasql.trim()}`;
      } else {
        dynamicArgs = "";
      }
    }

    return NextResponse.json({
      success: true,
      tool: toolInfo.tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: dynamicArgs,
      descr: toolInfo.descr,
      version: versionToUse || toolInfo.version || null,
      pkeyfile: user?.pkeyfile || null,
      ...(ptFolder
        ? {
            ptversion: versionToUse,
            ptFolder,
          }
        : {}),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'outil:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des informations" },
      { status: 500 }
    );
  }
}
