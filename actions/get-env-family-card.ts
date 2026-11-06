"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { canAccessEnvironmentForSession } from "@/lib/environment-access";
import type { EnvFamilyEnvironment } from "@/components/harp/EnvFamilyCard";

const EnvIdSchema = z.number().int().positive("Identifiant d'environnement invalide");

export type EnvFamilyCardResult =
  | { success: true; envsharp: EnvFamilyEnvironment }
  | { success: false; error: "denied" | "unavailable" };

/**
 * Charge la fiche complète d'un seul environnement.
 * La session, la famille et le périmètre sont relus en base avant tout renvoi.
 * Les mots de passe ne sont pas journalisés.
 *
 * @param envId - Identifiant envsharp.id demandé par la ligne compacte
 * @returns La fiche autorisée, un refus d'accès, ou une indisponibilité sans détail
 */
export async function getEnvFamilyCard(envId: number): Promise<EnvFamilyCardResult> {
  const parsed = EnvIdSchema.safeParse(envId);
  if (!parsed.success) {
    return { success: false, error: "unavailable" };
  }

  try {
    const access = await canAccessEnvironmentForSession(parsed.data);
    if (access === 401 || access === 403) {
      return { success: false, error: "denied" };
    }
    if (access !== 200) {
      return { success: false, error: "unavailable" };
    }

    const row = await prisma.envsharp.findUnique({
      where: { id: parsed.data },
      select: {
        id: true,
        env: true,
        descr: true,
        url: true,
        appli: true,
        harprelease: true,
        psversion: true,
        ptversion: true,
        volum: true,
        aliasql: true,
        oraschema: true,
        instanceId: true,
        orarelease: true,
        anonym: true,
        edi: true,
        statutenv: {
          select: {
            id: true,
            statenv: true,
            icone: true,
          },
        },
        harpenvinfo: {
          select: {
            datmaj: true,
            refreshdt: true,
            pswd_ft_exploit: true,
            pswd_oraquery: true,
            datadt: true,
            modedt: true,
            userunx: true,
          },
          orderBy: {
            datmaj: "desc",
          },
          take: 1,
        },
      },
    });

    if (!row) {
      return { success: false, error: "unavailable" };
    }

    const servers = await prisma.harpenvserv.findMany({
      where: { envId: row.id },
      select: {
        typsrv: true,
        harpserve: {
          select: {
            id: true,
            ip: true,
            psuser: true,
            srv: true,
            pshome: true,
            domain: true,
          },
        },
      },
      orderBy: [{ typsrv: "asc" }, { envId: "asc" }],
    });
    const dbServer = servers.find((server) => server.typsrv === "DB");
    const serverInfo = dbServer?.harpserve || servers[0]?.harpserve || null;

    return {
      success: true,
      envsharp: {
        ...row,
        serverInfo,
      },
    };
  } catch {
    console.error("Erreur lors du chargement de la fiche environnement");
    return { success: false, error: "unavailable" };
  }
}
