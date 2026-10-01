import { NextRequest, NextResponse } from "next/server";
import { executeLauncherToolRequest } from "@/lib/launcher-execution";

/**
 * Informations d'un outil pour le launcher Windows.
 * La version signée du jeton choisit le chemin.
 * Un jeton v1 est refusé. Les champs libres de la query ne construisent pas la commande.
 *
 * GET /api/launcher/tool?tool=putty&token=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await executeLauncherToolRequest({
      token: searchParams.get("token"),
      tool: searchParams.get("tool"),
      queryNetid: searchParams.get("netid"),
      ptversion: searchParams.get("ptversion"),
      aliasql: searchParams.get("aliasql"),
      ip: searchParams.get("ip"),
      host: searchParams.get("host"),
      user: searchParams.get("user"),
      sshkey: searchParams.get("sshkey"),
      pkeyfile: searchParams.get("pkeyfile"),
      path: searchParams.get("path"),
      exe: searchParams.get("exe"),
      command: searchParams.get("command"),
      pshome: searchParams.get("pshome"),
      envId: searchParams.get("envId"),
      secret: process.env.AUTH_SECRET,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'outil:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des informations" },
      { status: 500 }
    );
  }
}
