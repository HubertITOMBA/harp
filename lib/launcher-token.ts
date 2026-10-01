import { createHmac, timingSafeEqual } from "crypto";
import { normalizeFreeSshHost } from "@/lib/free-ssh-host";

/** Durée de vie du jeton de lancement, en secondes. */
export const LAUNCHER_TOKEN_TTL_SECONDS = 120;

/** Forme historique d'un jeton v1. Elle sert uniquement à le reconnaître pour le refuser. */
type TokenPayload = {
  v: number;
  netid: string;
  tool: string;
  exp: number;
};

/** Version historique v1. Reconnue uniquement pour être refusée, jamais pour lancer. */
export const LAUNCHER_TOKEN_VERSION_LEGACY = 1;

/** Version signée des jetons liés à une cible autorisée. */
export const LAUNCHER_TOKEN_VERSION_TARGET = 2;

/** Version signée des jetons qui ne peuvent pas lancer une commande. */
export const LAUNCHER_TOKEN_VERSION_AVAILABILITY = 3;

/** Usage explicite d'un jeton de disponibilité. */
export const LAUNCHER_TOKEN_USE_AVAILABILITY = "availability";

/** Version signée d'un PuTTY d'administration, sans environnement. */
export const LAUNCHER_TOKEN_VERSION_ADMIN_SERVER = 4;

/** Cible d'un lancement PuTTY réservé à PORTAL_ADMIN. */
export const LAUNCHER_ADMIN_SERVER_TARGET = "admin-server";

/** Version signée d'un PuTTY SSH libre, sans environnement ni serveur catalogué. */
export const LAUNCHER_TOKEN_VERSION_FREE_SSH = 5;

/** Cible d'un lancement PuTTY dont l'hôte est saisi, et l'identité imposée. */
export const LAUNCHER_FREE_SSH_TARGET = "free-ssh";

/** Version signée d'un outil local, sans cible distante. */
export const LAUNCHER_TOKEN_VERSION_LOCAL_TOOL = 6;

/** Cible d'un exécutable local autorisé par son nom logique. */
export const LAUNCHER_LOCAL_TOOL_TARGET = "local-tool";

/** Seul outil local autorisé par ce palier. */
export const LAUNCHER_LOCAL_TOOLS = ["sqldeveloper"] as const;

export type TargetBoundServerPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_TARGET;
  targetType: "server";
  envId: number;
  serverId: number;
  tool: "putty" | "filezilla";
  hostname: string;
  ip: string;
  netid: string;
  exp: number;
};

export type TargetBoundSqlplusPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_TARGET;
  targetType: "environment";
  envId: number;
  tool: "sqlplus";
  aliasql: string;
  netid: string;
  exp: number;
};

export type TargetBoundPeopleSoftPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_TARGET;
  targetType: "environment";
  envId: number;
  tool: "pside" | "psdmt";
  aliasql: string | null;
  ptversion: string;
  netid: string;
  exp: number;
};

export type TargetBoundPayload =
  | TargetBoundServerPayload
  | TargetBoundSqlplusPayload
  | TargetBoundPeopleSoftPayload;

export type TargetBoundVerification =
  | { ok: true; kind: "target-bound"; payload: TargetBoundPayload }
  | {
      ok: false;
      reason:
        | "invalid"
        | "expired"
        | "legacy"
        | "unknown_version"
        | "availability"
        | "admin-server"
        | "free-ssh"
        | "local-tool";
    };

export type AdminServerLaunchPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_ADMIN_SERVER;
  targetType: typeof LAUNCHER_ADMIN_SERVER_TARGET;
  tool: "putty";
  serverId: number;
  hostname: string;
  ip: string;
  netid: string;
  exp: number;
};

export type AdminServerVerification =
  | { ok: true; payload: AdminServerLaunchPayload }
  | { ok: false; reason: "invalid" | "expired" | "unknown_version" | "target-bound" | "free-ssh" | "local-tool" };

export type FreeSshLaunchPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_FREE_SSH;
  targetType: typeof LAUNCHER_FREE_SSH_TARGET;
  tool: "putty";
  host: string;
  netid: string;
  exp: number;
};

export type FreeSshVerification =
  | { ok: true; payload: FreeSshLaunchPayload }
  | {
      ok: false;
      reason:
        | "invalid"
        | "expired"
        | "unknown_version"
        | "legacy"
        | "target-bound"
        | "admin-server"
        | "availability"
        | "local-tool";
    };

export type LocalToolLaunchPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_LOCAL_TOOL;
  targetType: typeof LAUNCHER_LOCAL_TOOL_TARGET;
  tool: (typeof LAUNCHER_LOCAL_TOOLS)[number];
  netid: string;
  exp: number;
};

export type LocalToolVerification =
  | { ok: true; payload: LocalToolLaunchPayload }
  | {
      ok: false;
      reason:
        | "invalid"
        | "expired"
        | "unknown_version"
        | "legacy"
        | "target-bound"
        | "admin-server"
        | "free-ssh"
        | "availability";
    };

export type AvailabilityPayload = {
  v: typeof LAUNCHER_TOKEN_VERSION_AVAILABILITY;
  use: typeof LAUNCHER_TOKEN_USE_AVAILABILITY;
  netid: string;
  tool: string;
  exp: number;
};

export type AvailabilityVerification =
  | { ok: true; netid: string; tool: string; exp: number }
  | { ok: false; reason: "invalid" | "expired" | "unknown_version" };

export type ClassifiedLauncherToken =
  | { ok: true; kind: "legacy"; netid: string; tool: string; exp: number }
  | { ok: true; kind: "target-bound"; payload: TargetBoundPayload }
  | { ok: true; kind: "availability"; netid: string; tool: string; exp: number }
  | { ok: true; kind: "admin-server"; payload: AdminServerLaunchPayload }
  | { ok: true; kind: "free-ssh"; payload: FreeSshLaunchPayload }
  | { ok: true; kind: "local-tool"; payload: LocalToolLaunchPayload }
  | { ok: false; reason: "invalid" | "expired" | "unknown_version" };

const AVAILABILITY_FORBIDDEN_FIELDS = [
  "envId",
  "serverId",
  "ip",
  "hostname",
  "host",
  "aliasql",
  "ptversion",
  "targetType",
] as const;

function signJson(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function openSignedJson(
  token: string,
  secret: string
): { ok: true; value: unknown } | { ok: false; reason: "invalid" } {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "invalid" };
  }
  const [body, signature] = parts;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return { ok: false, reason: "invalid" };
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.from(body, "base64url").toString("utf8")) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

function isKnownLauncherVersion(version: unknown): boolean {
  return (
    version === LAUNCHER_TOKEN_VERSION_LEGACY ||
    version === LAUNCHER_TOKEN_VERSION_TARGET ||
    version === LAUNCHER_TOKEN_VERSION_AVAILABILITY ||
    version === LAUNCHER_TOKEN_VERSION_ADMIN_SERVER ||
    version === LAUNCHER_TOKEN_VERSION_FREE_SSH ||
    version === LAUNCHER_TOKEN_VERSION_LOCAL_TOOL
  );
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isTargetBoundPayload(value: unknown): value is TargetBoundPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== LAUNCHER_TOKEN_VERSION_TARGET) {
    return false;
  }
  if (typeof payload.netid !== "string" || payload.netid.trim() === "") {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return false;
  }
  if (!isPositiveInt(payload.envId) || typeof payload.tool !== "string") {
    return false;
  }

  if (payload.targetType === "server") {
    return (
      (payload.tool === "putty" || payload.tool === "filezilla") &&
      isPositiveInt(payload.serverId) &&
      typeof payload.hostname === "string" &&
      typeof payload.ip === "string" &&
      (payload.tool === "putty"
        ? payload.hostname.trim() !== "" || payload.ip.trim() !== ""
        : payload.ip.trim() !== "")
    );
  }

  if (payload.targetType !== "environment") {
    return false;
  }
  if (payload.tool === "sqlplus") {
    return typeof payload.aliasql === "string" && payload.aliasql.trim() !== "";
  }
  if (payload.tool === "pside" || payload.tool === "psdmt") {
    return (
      (payload.aliasql === null || typeof payload.aliasql === "string") &&
      typeof payload.ptversion === "string" &&
      payload.ptversion.trim() !== ""
    );
  }
  return false;
}

function isLegacyPayload(value: unknown): value is TokenPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as TokenPayload;
  return (
    payload.v === LAUNCHER_TOKEN_VERSION_LEGACY &&
    typeof payload.netid === "string" &&
    payload.netid.trim() !== "" &&
    typeof payload.tool === "string" &&
    payload.tool.trim() !== "" &&
    typeof payload.exp === "number" &&
    (payload as { use?: unknown }).use === undefined
  );
}

function isAvailabilityPayload(value: unknown): value is AvailabilityPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== LAUNCHER_TOKEN_VERSION_AVAILABILITY) {
    return false;
  }
  if (payload.use !== LAUNCHER_TOKEN_USE_AVAILABILITY) {
    return false;
  }
  if (typeof payload.netid !== "string" || payload.netid.trim() === "") {
    return false;
  }
  if (typeof payload.tool !== "string" || payload.tool.trim() === "") {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return false;
  }
  return AVAILABILITY_FORBIDDEN_FIELDS.every((field) => !(field in payload));
}

function isAdminServerPayload(value: unknown): value is AdminServerLaunchPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== LAUNCHER_TOKEN_VERSION_ADMIN_SERVER) {
    return false;
  }
  if (payload.targetType !== LAUNCHER_ADMIN_SERVER_TARGET) {
    return false;
  }
  if (payload.tool !== "putty") {
    return false;
  }
  if (!isPositiveInt(payload.serverId)) {
    return false;
  }
  if (typeof payload.hostname !== "string" || typeof payload.ip !== "string") {
    return false;
  }
  if (payload.hostname.trim() === "" && payload.ip.trim() === "") {
    return false;
  }
  if (typeof payload.netid !== "string" || payload.netid.trim() === "") {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return false;
  }
  return !("envId" in payload) && !("pkeyfile" in payload) && !("sshkey" in payload) && !("aliasql" in payload);
}

function isFreeSshPayload(value: unknown): value is FreeSshLaunchPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== LAUNCHER_TOKEN_VERSION_FREE_SSH) {
    return false;
  }
  if (payload.targetType !== LAUNCHER_FREE_SSH_TARGET) {
    return false;
  }
  if (payload.tool !== "putty") {
    return false;
  }
  if (typeof payload.host !== "string" || normalizeFreeSshHost(payload.host) !== payload.host) {
    return false;
  }
  if (typeof payload.netid !== "string" || payload.netid.trim() === "") {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return false;
  }
  return (
    !("envId" in payload) &&
    !("serverId" in payload) &&
    !("pkeyfile" in payload) &&
    !("sshkey" in payload) &&
    !("user" in payload)
  );
}

const LOCAL_TOOL_FORBIDDEN_FIELDS = [
  "envId",
  "serverId",
  "aliasql",
  "ptversion",
  "pshome",
  "ip",
  "hostname",
  "host",
  "pkeyfile",
  "sshkey",
  "user",
  "path",
  "exe",
  "command",
] as const;

function isLocalToolPayload(value: unknown): value is LocalToolLaunchPayload {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== LAUNCHER_TOKEN_VERSION_LOCAL_TOOL) {
    return false;
  }
  if (payload.targetType !== LAUNCHER_LOCAL_TOOL_TARGET) {
    return false;
  }
  if (payload.tool !== "sqldeveloper") {
    return false;
  }
  if (typeof payload.netid !== "string" || payload.netid.trim() === "") {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return false;
  }
  return LOCAL_TOOL_FORBIDDEN_FIELDS.every((field) => !(field in payload));
}

/**
 * Signe un jeton v2 dont chaque champ de cible fait partie du HMAC.
 * Le validateur d'exécution v1 ne reconnaît pas ce jeton.
 *
 * @param payload - Cible déjà autorisée, netid de session et expiration
 * @param secret - AUTH_SECRET
 * @returns Jeton `corps.signature`
 */
export function signTargetBoundLauncherToken(payload: TargetBoundPayload, secret: string): string {
  return signJson(payload, secret);
}

/**
 * Vérifie un jeton lié à une cible. Un jeton v1 signé est reconnu comme legacy et refusé.
 * GET /api/launcher/tool appelle cette primitive pour un jeton classé v2.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function verifyTargetBoundLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): TargetBoundVerification {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (isLegacyPayload(opened.value)) {
    return { ok: false, reason: "legacy" };
  }
  if (isTargetBoundPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, kind: "target-bound", payload: opened.value };
  }
  if (isAvailabilityPayload(opened.value)) {
    return { ok: false, reason: "availability" };
  }
  if (isAdminServerPayload(opened.value)) {
    return { ok: false, reason: "admin-server" };
  }
  if (isFreeSshPayload(opened.value)) {
    return { ok: false, reason: "free-ssh" };
  }
  if (isLocalToolPayload(opened.value)) {
    return { ok: false, reason: "local-tool" };
  }
  const version = (opened.value as { v?: unknown } | null)?.v;
  if (typeof version === "number" && !isKnownLauncherVersion(version)) {
    return { ok: false, reason: "unknown_version" };
  }
  return { ok: false, reason: "invalid" };
}

/**
 * Signe un jeton qui autorise uniquement la lecture de configuration d'un outil.
 * Il ne contient aucune cible.
 *
 * @param input - netid de session et nom d'outil
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 * @returns Jeton `corps.signature`
 */
export function signAvailabilityToken(
  input: { netid: string; tool: string },
  secret: string,
  nowMs: number = Date.now()
): string {
  const payload: AvailabilityPayload = {
    v: LAUNCHER_TOKEN_VERSION_AVAILABILITY,
    use: LAUNCHER_TOKEN_USE_AVAILABILITY,
    netid: input.netid,
    tool: input.tool,
    exp: Math.floor(nowMs / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };
  return signJson(payload, secret);
}

/**
 * Vérifie un jeton de disponibilité. Un jeton de lancement n'est pas accepté.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function verifyAvailabilityToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): AvailabilityVerification {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (!isAvailabilityPayload(opened.value)) {
    const version = (opened.value as { v?: unknown } | null)?.v;
    if (typeof version === "number" && !isKnownLauncherVersion(version)) {
      return { ok: false, reason: "unknown_version" };
    }
    return { ok: false, reason: "invalid" };
  }
  if (opened.value.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return {
    ok: true,
    netid: opened.value.netid,
    tool: opened.value.tool,
    exp: opened.value.exp,
  };
}

/**
 * Signe un PuTTY d'administration. Le payload ne contient pas d'environnement ni de clé.
 *
 * @param payload - Serveur relu et netid de session
 * @param secret - AUTH_SECRET
 * @returns Jeton `corps.signature`
 */
export function signAdminServerLauncherToken(payload: AdminServerLaunchPayload, secret: string): string {
  return signJson(payload, secret);
}

/**
 * Vérifie un jeton d'administration serveur. Un jeton v2 d'environnement n'est pas accepté.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function verifyAdminServerLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): AdminServerVerification {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (isTargetBoundPayload(opened.value)) {
    return { ok: false, reason: "target-bound" };
  }
  if (isFreeSshPayload(opened.value)) {
    return { ok: false, reason: "free-ssh" };
  }
  if (isLocalToolPayload(opened.value)) {
    return { ok: false, reason: "local-tool" };
  }
  if (!isAdminServerPayload(opened.value)) {
    const version = (opened.value as { v?: unknown } | null)?.v;
    if (typeof version === "number" && !isKnownLauncherVersion(version)) {
      return { ok: false, reason: "unknown_version" };
    }
    return { ok: false, reason: "invalid" };
  }
  if (opened.value.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload: opened.value };
}

/**
 * Signe un PuTTY SSH libre. L'hôte est celui validé. La clé n'est pas dans le payload.
 *
 * @param payload - Hôte normalisé, netid de session et expiration
 * @param secret - AUTH_SECRET
 * @returns Jeton `corps.signature`
 */
export function signFreeSshLauncherToken(payload: FreeSshLaunchPayload, secret: string): string {
  return signJson(payload, secret);
}

/**
 * Vérifie un jeton SSH libre. Un jeton v1, v2 ou v4 n'est pas accepté.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function verifyFreeSshLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): FreeSshVerification {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (isLegacyPayload(opened.value)) {
    return { ok: false, reason: "legacy" };
  }
  if (isTargetBoundPayload(opened.value)) {
    return { ok: false, reason: "target-bound" };
  }
  if (isAdminServerPayload(opened.value)) {
    return { ok: false, reason: "admin-server" };
  }
  if (isAvailabilityPayload(opened.value)) {
    return { ok: false, reason: "availability" };
  }
  if (isLocalToolPayload(opened.value)) {
    return { ok: false, reason: "local-tool" };
  }
  if (!isFreeSshPayload(opened.value)) {
    const version = (opened.value as { v?: unknown } | null)?.v;
    if (typeof version === "number" && !isKnownLauncherVersion(version)) {
      return { ok: false, reason: "unknown_version" };
    }
    return { ok: false, reason: "invalid" };
  }
  if (opened.value.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload: opened.value };
}

/**
 * Signe un outil local. Le payload ne contient ni chemin ni cible distante.
 *
 * @param payload - Nom logique autorisé, netid de session et expiration
 * @param secret - AUTH_SECRET
 * @returns Jeton `corps.signature`
 */
export function signLocalToolLauncherToken(payload: LocalToolLaunchPayload, secret: string): string {
  return signJson(payload, secret);
}

/**
 * Vérifie un jeton d'outil local. Un jeton v1, v2, v4 ou v5 n'est pas accepté.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function verifyLocalToolLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): LocalToolVerification {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (isLegacyPayload(opened.value)) {
    return { ok: false, reason: "legacy" };
  }
  if (isTargetBoundPayload(opened.value)) {
    return { ok: false, reason: "target-bound" };
  }
  if (isAdminServerPayload(opened.value)) {
    return { ok: false, reason: "admin-server" };
  }
  if (isFreeSshPayload(opened.value)) {
    return { ok: false, reason: "free-ssh" };
  }
  if (isAvailabilityPayload(opened.value)) {
    return { ok: false, reason: "availability" };
  }
  if (!isLocalToolPayload(opened.value)) {
    const version = (opened.value as { v?: unknown } | null)?.v;
    if (typeof version === "number" && !isKnownLauncherVersion(version)) {
      return { ok: false, reason: "unknown_version" };
    }
    return { ok: false, reason: "invalid" };
  }
  if (opened.value.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload: opened.value };
}

/**
 * Distingue un jeton legacy v1 d'un jeton cible v2 après vérification de la signature.
 * Le palier d'exécution pourra refuser le legacy sans le confondre avec une cible.
 *
 * @param token - Jeton reçu
 * @param secret - AUTH_SECRET
 * @param nowMs - Instant courant, injectable pour les tests
 */
export function classifyLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): ClassifiedLauncherToken {
  const opened = openSignedJson(token, secret);
  if (!opened.ok) {
    return opened;
  }
  if (isLegacyPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return {
      ok: true,
      kind: "legacy",
      netid: opened.value.netid,
      tool: opened.value.tool,
      exp: opened.value.exp,
    };
  }
  if (isAvailabilityPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return {
      ok: true,
      kind: "availability",
      netid: opened.value.netid,
      tool: opened.value.tool,
      exp: opened.value.exp,
    };
  }
  if (isAdminServerPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, kind: "admin-server", payload: opened.value };
  }
  if (isFreeSshPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, kind: "free-ssh", payload: opened.value };
  }
  if (isLocalToolPayload(opened.value)) {
    if (opened.value.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, kind: "local-tool", payload: opened.value };
  }
  if (!isTargetBoundPayload(opened.value)) {
    const version = (opened.value as { v?: unknown } | null)?.v;
    if (typeof version === "number" && !isKnownLauncherVersion(version)) {
      return { ok: false, reason: "unknown_version" };
    }
    return { ok: false, reason: "invalid" };
  }
  if (opened.value.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, kind: "target-bound", payload: opened.value };
}
