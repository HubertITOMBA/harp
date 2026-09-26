import { createHmac, timingSafeEqual } from "crypto";

/** Durée de vie du jeton de lancement, en secondes. */
export const LAUNCHER_TOKEN_TTL_SECONDS = 120;

export type LauncherTokenFailure = "absent" | "invalid" | "expired" | "mismatch";

export type LauncherAccess =
  | { ok: true; netid: string; tool: string }
  | { ok: false; status: 401 | 403 | 500; error: string; reason: LauncherTokenFailure | "config" };

type TokenPayload = {
  v: number;
  netid: string;
  tool: string;
  exp: number;
};

/**
 * Signe un jeton court lié à l'identité de session et à l'outil.
 * Le secret reste côté serveur. Il n'est jamais inclus dans le jeton.
 *
 * @param input - netid de la session et nom d'outil
 * @param secret - secret serveur déjà utilisé pour l'authentification
 * @param nowMs - instant courant, injectable pour les tests
 * @returns Jeton `corps.signature`
 */
export function signLauncherToken(
  input: { netid: string; tool: string },
  secret: string,
  nowMs: number = Date.now()
): string {
  const payload: TokenPayload = {
    v: 1,
    netid: input.netid,
    tool: input.tool,
    exp: Math.floor(nowMs / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/**
 * Vérifie la signature et l'expiration. Ne consulte aucune identité externe.
 *
 * @param token - jeton reçu
 * @param secret - secret serveur
 * @param nowMs - instant courant, injectable pour les tests
 */
export function verifyLauncherToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): { ok: true; netid: string; tool: string } | { ok: false; reason: LauncherTokenFailure } {
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

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (
    payload?.v !== 1 ||
    typeof payload.netid !== "string" ||
    payload.netid.trim() === "" ||
    typeof payload.tool !== "string" ||
    payload.tool.trim() === "" ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (payload.exp <= Math.floor(nowMs / 1000)) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, netid: payload.netid, tool: payload.tool };
}

/**
 * Décide l'accès à la lecture d'outil.
 * Le netid de query est accepté en entrée et ignoré : l'identité vient du jeton.
 *
 * @param input - jeton, outil demandé, netid de query ignoré, secret
 */
export function resolveLauncherIdentity(input: {
  token: string | null;
  tool: string | null;
  queryNetid?: string | null;
  secret: string | undefined;
  nowMs?: number;
}): LauncherAccess {
  void input.queryNetid;

  const token = input.token?.trim() ?? "";
  if (!token) {
    return { ok: false, status: 401, error: "Jeton absent", reason: "absent" };
  }

  if (!input.secret) {
    return {
      ok: false,
      status: 500,
      error: "Configuration d'authentification indisponible",
      reason: "config",
    };
  }

  const verified = verifyLauncherToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return { ok: false, status: 401, error: "Jeton expiré", reason: "expired" };
    }
    return { ok: false, status: 401, error: "Jeton invalide", reason: "invalid" };
  }

  const requestedTool = input.tool?.trim() ?? "";
  if (requestedTool !== verified.tool) {
    return {
      ok: false,
      status: 403,
      error: "Outil non autorisé par le jeton",
      reason: "mismatch",
    };
  }

  return { ok: true, netid: verified.netid, tool: verified.tool };
}
