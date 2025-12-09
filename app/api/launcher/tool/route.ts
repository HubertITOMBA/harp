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
    let fullPath = "";
    if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
      return NextResponse.json(
        { error: `L'outil '${tool}' n'a pas de commande (cmd) définie dans la base de données` },
        { status: 400 }
      );
    }

    if (toolInfo.cmdpath && toolInfo.cmdpath.trim() !== "") {
      // Si cmdpath existe, construire le chemin complet
      const cmdpath = toolInfo.cmdpath.trim().replace(/\\$/, ""); // Enlever le \ final s'il existe
      const cmd = toolInfo.cmd.trim();
      fullPath = `${cmdpath}\\${cmd}`;
    } else {
      // Sinon, utiliser seulement cmd (qui peut être un chemin complet)
      fullPath = toolInfo.cmd.trim();
    }

    // Normaliser les backslashes pour Windows
    fullPath = fullPath.replace(/\//g, "\\");

    return NextResponse.json({
      success: true,
      tool: toolInfo.tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: toolInfo.cmdarg || "",
      descr: toolInfo.descr,
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
