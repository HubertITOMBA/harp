import { db } from "@/lib/db";
import {
  buildPeopleSoftClientPath,
  normalizePeopleToolsVersion,
} from "@/lib/ptools-path";

const PEOPLESOFT_CLIENT_TOOLS = new Set(["pside", "psdmt"]);

export type LauncherToolResult = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Lit l'outil et le chemin de clé de l'identité déjà authentifiée par le jeton.
 * `netid` doit venir du jeton, jamais d'une query cliente.
 *
 * @param input - outil signé, netid signé, paramètres de lancement non identitaires
 */
export async function readLauncherTool(input: {
  tool: string;
  netid: string;
  ptversion: string | null;
  aliasql: string | null;
  ip: string | null;
}): Promise<LauncherToolResult> {
  const { tool, netid } = input;

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

  if (PEOPLESOFT_CLIENT_TOOLS.has(tool)) {
    const normalized = normalizePeopleToolsVersion(input.ptversion);
    if (!normalized.ok) {
      return { status: 400, body: { error: normalized.error } };
    }
    versionToUse = normalized.display;
    ptFolder = `pt${normalized.folderSuffix}`;
    if (tool !== "pside" && tool !== "psdmt") {
      return { status: 400, body: { error: `Outil PeopleSoft non supporté: ${tool}` } };
    }
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

  let dynamicArgs = toolInfo.cmdarg || "";
  const aliasql = input.aliasql?.trim() ?? "";
  const ip = input.ip?.trim() ?? "";

  if (tool === "psdmt" || tool === "pside") {
    dynamicArgs = aliasql ? `-CT ORACLE -CD ${aliasql}` : "";
  } else if (tool === "filezilla") {
    if (ip && netid) {
      let sftpUrl = `sftp://${netid}@${ip}:22/`;
      if (user.pkeyfile?.trim()) {
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
    dynamicArgs = aliasql ? `/@${aliasql}` : "";
  }

  return {
    status: 200,
    body: {
      success: true,
      tool: toolInfo.tool,
      path: fullPath,
      cmdpath: toolInfo.cmdpath || "",
      cmd: toolInfo.cmd,
      cmdarg: dynamicArgs,
      descr: toolInfo.descr,
      version: versionToUse || toolInfo.version || null,
      pkeyfile: user.pkeyfile || null,
      ...(ptFolder ? { ptversion: versionToUse, ptFolder } : {}),
    },
  };
}
