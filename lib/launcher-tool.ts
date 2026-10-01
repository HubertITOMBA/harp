import { db } from "@/lib/db";
import type { AdminServerLaunchPayload, FreeSshLaunchPayload, LocalToolLaunchPayload, TargetBoundPayload } from "@/lib/launcher-token";
import {
  buildPeopleSoftClientPath,
  normalizePeopleToolsVersion,
} from "@/lib/ptools-path";

export type LauncherToolResult = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Indique si l'outil est configuré, sans construire d'arguments de cible.
 * ptversion, aliasql et ip ne sont pas des paramètres de cette lecture.
 *
 * @param input - Outil et netid déjà vérifiés sur un jeton de disponibilité
 */
export async function readLauncherAvailability(input: {
  tool: string;
  netid: string;
}): Promise<LauncherToolResult> {
  const toolInfo = await db.harptools.findFirst({
    where: { tool: input.tool },
    select: {
      tool: true,
      cmdpath: true,
      cmd: true,
      descr: true,
      version: true,
    },
  });

  if (!toolInfo) {
    return {
      status: 404,
      body: { error: `Outil '${input.tool}' non trouvé dans la base de données` },
    };
  }

  if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
    return {
      status: 400,
      body: {
        error: `L'outil '${input.tool}' n'a pas de commande (cmd) définie dans la base de données`,
      },
    };
  }

  const user = await db.user.findUnique({
    where: { netid: input.netid },
    select: { id: true },
  });
  if (!user) {
    return { status: 404, body: { error: "Utilisateur introuvable" } };
  }

  const cmd = toolInfo.cmd.trim();
  const cmdpath = toolInfo.cmdpath?.trim().replace(/\\$/, "") ?? "";
  const fullPath = (cmdpath !== "" ? `${cmdpath}\\${cmd}` : cmd).replace(/\//g, "\\");

  return {
    status: 200,
    body: {
      success: true,
      availability: true,
      tool: toolInfo.tool,
      path: fullPath,
      cmd: toolInfo.cmd,
      descr: toolInfo.descr,
      version: toolInfo.version || null,
    },
  };
}

/**
 * Construit la commande d'un jeton v2.
 * hostname, IP, aliasql et ptversion viennent uniquement du payload signé.
 *
 * @param payload - Cible déjà vérifiée par verifyTargetBoundLauncherToken
 */
export async function readTargetBoundLauncherTool(
  payload: TargetBoundPayload
): Promise<LauncherToolResult> {
  const tool = payload.tool;
  const netid = payload.netid;

  const toolInfo = await db.harptools.findFirst({
    where: { tool },
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
    return {
      status: 404,
      body: { error: `Outil '${tool}' non trouvé dans la base de données` },
    };
  }

  if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
    return {
      status: 400,
      body: {
        error: `L'outil '${tool}' n'a pas de commande (cmd) définie dans la base de données`,
      },
    };
  }

  const cmd = toolInfo.cmd.trim();
  let fullPath = "";
  let versionToUse: string | null = null;
  let ptFolder: string | null = null;
  const signedVersion = payload.targetType === "environment" && payload.tool !== "sqlplus"
    ? payload.ptversion
    : null;

  if (tool === "pside" || tool === "psdmt") {
    const normalized = normalizePeopleToolsVersion(signedVersion);
    if (!normalized.ok) {
      return { status: 400, body: { error: normalized.error } };
    }
    versionToUse = normalized.display;
    ptFolder = `pt${normalized.folderSuffix}`;
    fullPath = buildPeopleSoftClientPath(tool, normalized.folderSuffix);
  } else if (toolInfo.cmdpath && toolInfo.cmdpath.trim() !== "") {
    const cmdpath = toolInfo.cmdpath.trim().replace(/\\$/, "");
    fullPath = `${cmdpath}\\${cmd}`;
  } else {
    fullPath = cmd;
  }

  fullPath = fullPath.replace(/\//g, "\\");

  const user = await db.user.findUnique({
    where: { netid },
    select: { pkeyfile: true },
  });

  if (!user) {
    return { status: 404, body: { error: "Utilisateur introuvable" } };
  }

  let dynamicArgs = "";
  let launchHost = "";

  if (payload.targetType === "server") {
    const ip = payload.ip.trim();
    const hostname = payload.hostname.trim();
    launchHost = ip !== "" ? ip : hostname;
    if (tool === "filezilla") {
      let sftpUrl = `sftp://${netid}@${ip}:22/`;
      if (user.pkeyfile?.trim()) {
        const keyfile = user.pkeyfile.trim().replace(/\\/g, "/");
        sftpUrl += `?keyfile=${keyfile}`;
      }
      dynamicArgs = sftpUrl;
    }
  } else if (tool === "sqlplus") {
    dynamicArgs = `/@${payload.aliasql}`;
  } else if ((tool === "pside" || tool === "psdmt") && payload.aliasql) {
    dynamicArgs = `-CT ORACLE -CD ${payload.aliasql}`;
  }

  return {
    status: 200,
    body: {
      success: true,
      targetBound: true,
      tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: dynamicArgs,
      descr: toolInfo.descr,
      version: versionToUse || toolInfo.version || null,
      pkeyfile: user.pkeyfile || null,
      netid,
      envId: payload.envId,
      launchHost,
      ...(payload.targetType === "server"
        ? { serverId: payload.serverId, hostname: payload.hostname, ip: payload.ip }
        : {}),
      ...(ptFolder ? { ptversion: versionToUse, ptFolder } : {}),
    },
  };
}

/**
 * Construit le PuTTY d'administration depuis le payload signé.
 * La clé est relue pour le netid du jeton. Aucun champ client n'est lu.
 *
 * @param payload - Cible déjà vérifiée par verifyAdminServerLauncherToken
 */
export async function readAdminServerPutty(
  payload: AdminServerLaunchPayload
): Promise<LauncherToolResult> {
  const user = await db.user.findUnique({
    where: { netid: payload.netid },
    select: { pkeyfile: true },
  });
  if (!user) {
    return { status: 404, body: { error: "Utilisateur introuvable" } };
  }
  const pkeyfile = user.pkeyfile?.trim() ?? "";
  if (pkeyfile === "") {
    return { status: 403, body: { error: "Clé SSH absente" } };
  }

  const toolInfo = await db.harptools.findFirst({
    where: { tool: "putty" },
    select: { tool: true, cmdpath: true, cmd: true, descr: true, version: true },
  });
  if (!toolInfo) {
    return { status: 404, body: { error: "Outil 'putty' non trouvé dans la base de données" } };
  }
  if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
    return {
      status: 400,
      body: { error: "L'outil 'putty' n'a pas de commande (cmd) définie dans la base de données" },
    };
  }

  const cmd = toolInfo.cmd.trim();
  const cmdpath = toolInfo.cmdpath?.trim().replace(/\\$/, "") ?? "";
  const fullPath = (cmdpath !== "" ? `${cmdpath}\\${cmd}` : cmd).replace(/\//g, "\\");
  const ip = payload.ip.trim();
  const hostname = payload.hostname.trim();
  const launchHost = ip !== "" ? ip : hostname;

  return {
    status: 200,
    body: {
      success: true,
      targetBound: true,
      adminServer: true,
      tool: "putty",
      path: fullPath,
      cmd: toolInfo.cmd,
      cmdarg: "",
      descr: toolInfo.descr,
      version: toolInfo.version || null,
      pkeyfile,
      netid: payload.netid,
      serverId: payload.serverId,
      hostname,
      ip,
      launchHost,
    },
  };
}

/**
 * Construit le PuTTY SSH libre depuis le payload signé.
 * La clé est relue pour le netid du jeton. Hôte, compte et clé de query ne sont pas lus.
 *
 * @param payload - Cible déjà vérifiée par verifyFreeSshLauncherToken
 */
export async function readFreeSshPutty(payload: FreeSshLaunchPayload): Promise<LauncherToolResult> {
  const user = await db.user.findUnique({
    where: { netid: payload.netid },
    select: { pkeyfile: true },
  });
  if (!user) {
    return { status: 404, body: { error: "Utilisateur introuvable" } };
  }
  const pkeyfile = user.pkeyfile?.trim() ?? "";
  if (pkeyfile === "") {
    return { status: 403, body: { error: "Clé SSH absente" } };
  }

  const toolInfo = await db.harptools.findFirst({
    where: { tool: "putty" },
    select: { tool: true, cmdpath: true, cmd: true, descr: true, version: true },
  });
  if (!toolInfo) {
    return { status: 404, body: { error: "Outil 'putty' non trouvé dans la base de données" } };
  }
  if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
    return {
      status: 400,
      body: { error: "L'outil 'putty' n'a pas de commande (cmd) définie dans la base de données" },
    };
  }

  const cmd = toolInfo.cmd.trim();
  const cmdpath = toolInfo.cmdpath?.trim().replace(/\\$/, "") ?? "";
  const fullPath = (cmdpath !== "" ? `${cmdpath}\\${cmd}` : cmd).replace(/\//g, "\\");

  return {
    status: 200,
    body: {
      success: true,
      targetBound: true,
      freeSsh: true,
      tool: "putty",
      path: fullPath,
      cmd: toolInfo.cmd,
      cmdarg: "",
      descr: toolInfo.descr,
      version: toolInfo.version || null,
      pkeyfile,
      netid: payload.netid,
      host: payload.host,
      launchHost: payload.host,
    },
  };
}

/**
 * Résout un outil local depuis harptools.
 * Le nom vient du jeton. Le chemin et les arguments viennent de la base, jamais du client.
 * SQL Developer n'utilise pas de clé SSH.
 *
 * @param payload - Outil déjà vérifié par verifyLocalToolLauncherToken
 */
export async function readLocalTool(payload: LocalToolLaunchPayload): Promise<LauncherToolResult> {
  const account = await db.user.findUnique({
    where: { netid: payload.netid },
    select: { id: true },
  });
  if (!account) {
    return { status: 404, body: { error: "Utilisateur introuvable" } };
  }

  const toolInfo = await db.harptools.findFirst({
    where: { tool: payload.tool },
    select: { tool: true, cmdpath: true, cmd: true, cmdarg: true, descr: true, version: true },
  });
  if (!toolInfo) {
    return { status: 404, body: { error: `Outil '${payload.tool}' non trouvé dans la base de données` } };
  }
  if (!toolInfo.cmd || toolInfo.cmd.trim() === "") {
    return {
      status: 400,
      body: { error: `L'outil '${payload.tool}' n'a pas de commande (cmd) définie dans la base de données` },
    };
  }

  const cmd = toolInfo.cmd.trim();
  const cmdpath = toolInfo.cmdpath?.trim().replace(/\\$/, "") ?? "";
  const fullPath = (cmdpath !== "" ? `${cmdpath}\\${cmd}` : cmd).replace(/\//g, "\\");

  return {
    status: 200,
    body: {
      success: true,
      localTool: true,
      tool: payload.tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: toolInfo.cmdarg?.trim() ?? "",
      descr: toolInfo.descr,
      version: toolInfo.version || null,
      netid: payload.netid,
    },
  };
}
