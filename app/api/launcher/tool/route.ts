import { NextRequest, NextResponse } from "next/server";
import { readLauncherTool } from "@/lib/launcher-tool";
import { resolveLauncherIdentity } from "@/lib/launcher-token";

/**
 * Informations d'un outil pour le launcher Windows.
 * L'identité est celle du jeton signé. Le paramètre netid de la query est ignoré.
 *
 * GET /api/launcher/tool?tool=putty&token=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const access = resolveLauncherIdentity({
      token: searchParams.get("token"),
      tool: searchParams.get("tool"),
      queryNetid: searchParams.get("netid"),
      secret: process.env.AUTH_SECRET,
    });

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const result = await readLauncherTool({
      tool: access.tool,
      netid: access.netid,
      ptversion: searchParams.get("ptversion"),
      aliasql: searchParams.get("aliasql"),
      ip: searchParams.get("ip"),
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
