import { NextRequest, NextResponse } from "next/server";
import { executeAvailabilityRequest } from "@/lib/launcher-availability";

/**
 * Indique si un outil est configuré.
 * Le jeton accepté ici est refusé par GET /api/launcher/tool.
 * ip, host, aliasql et ptversion ne participent pas à la réponse.
 *
 * GET /api/launcher/availability?tool=putty&token=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await executeAvailabilityRequest({
      token: searchParams.get("token"),
      tool: searchParams.get("tool"),
      secret: process.env.AUTH_SECRET,
      ip: searchParams.get("ip"),
      host: searchParams.get("host"),
      aliasql: searchParams.get("aliasql"),
      ptversion: searchParams.get("ptversion"),
      queryNetid: searchParams.get("netid"),
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Erreur lors de la vérification de disponibilité:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification de disponibilité" },
      { status: 500 }
    );
  }
}
