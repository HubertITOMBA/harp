/**
 * Utilitaire pour construire les URLs du protocole mylaunch://
 * Utilisé pour lancer des applications Windows locales depuis le navigateur
 */

export type ExternalTool = 'putty' | 'pside' | 'ptsmt' | 'sqldeveloper' | 'psdmt' | 'pscfg' | 'sqlplus' | 'filezilla' | 'perl' | 'winscp' | 'winmerge';

export interface PuttyParams {
  host: string;
  user?: string;
  port?: string | number;
  sshkey?: string;
}

export interface PeopleSoftParams {
  dbname?: string;
  server?: string;
  user?: string;
  password?: string;
  [key: string]: string | number | undefined;
}

export type LauncherHealthCheckResult =
  | { running: true; health?: any }
  | { running: false; error?: string };

/**
 * Construit une URL mylaunch:// pour lancer PuTTY
 */
export function buildPuttyUrl(params: PuttyParams): string {
  const searchParams = new URLSearchParams();
  
  // Host est requis
  if (!params.host || params.host.trim() === '') {
    throw new Error('Le paramètre "host" est requis pour lancer PuTTY');
  }
  
  searchParams.set('host', params.host.trim());
  if (params.user && params.user.trim() !== '') {
    searchParams.set('user', params.user.trim());
  }
  if (params.port) {
    searchParams.set('port', String(params.port));
  }
  if (params.sshkey && params.sshkey.trim() !== '') {
    searchParams.set('sshkey', params.sshkey.trim());
  }
  
  return `mylaunch://putty?${searchParams.toString()}`;
}

/**
 * Construit une URL mylaunch:// pour lancer PeopleSoft (pside ou ptsmt)
 */
export function buildPeopleSoftUrl(
  tool: 'pside' | 'ptsmt',
  params?: PeopleSoftParams
): string {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  return `mylaunch://${tool}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
}

/**
 * Construit une URL mylaunch:// pour lancer SQL Developer
 */
export function buildSQLDeveloperUrl(): string {
  return `mylaunch://sqldeveloper`;
}

/**
 * Construit une URL mylaunch:// pour lancer un outil simple (sans paramètres)
 * Pour sqlplus : alias dans le chemin (mylaunch://sqlplus/ALIAS) car la query est souvent supprimée par le handler Windows.
 */
export function buildSimpleToolUrl(
  tool: 'psdmt' | 'pscfg' | 'sqlplus' | 'filezilla' | 'perl' | 'winscp' | 'winmerge',
  params?: Record<string, string | number | undefined>
): string {
  if (tool === 'sqlplus' && params?.aliasql) {
    const alias = String(params.aliasql).trim();
    if (alias) return `mylaunch://sqlplus/${encodeURIComponent(alias)}`;
  }
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    return `mylaunch://${tool}?${searchParams.toString()}`;
  }
  return `mylaunch://${tool}`;
}

/**
 * Fonction générique pour construire une URL mylaunch://
 */
export function buildMyLaunchUrl(
  tool: ExternalTool,
  params?: Record<string, string | number | undefined>
): string {
  switch (tool) {
    case 'putty':
      return buildPuttyUrl(params as PuttyParams);
    case 'pside':
    case 'ptsmt':
      return buildPeopleSoftUrl(tool, params as PeopleSoftParams);
    case 'sqldeveloper':
      return buildSQLDeveloperUrl();
    case 'psdmt':
    case 'pscfg':
    case 'sqlplus':
    case 'filezilla':
    case 'perl':
    case 'winscp':
    case 'winmerge':
      return buildSimpleToolUrl(tool, params);
    default:
      throw new Error(`Outil non supporté: ${tool}`);
  }
}

/** Navigateur détecté pour openurl (même valeur que le paramètre mylaunch). */
export type OpenUrlBrowser = 'chrome' | 'msedge' | 'firefox';

/**
 * Détecte le navigateur avec lequel l'application est ouverte (userAgent).
 * Permet au launcher de lancer le même navigateur avec --explicitly-allowed-ports=6000.
 */
export function getCurrentBrowser(): OpenUrlBrowser | null {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return null;
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'msedge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'chrome';
  if (/Firefox\//i.test(ua)) return 'firefox';
  return null;
}

/**
 * Construit une URL mylaunch://openurl pour ouvrir une URL dans le navigateur
 * avec le port 6000 autorisé. Si browser est fourni, le launcher lance ce navigateur.
 */
export function buildOpenUrlInBrowserUrl(targetUrl: string, browser?: OpenUrlBrowser | null): string {
  const searchParams = new URLSearchParams();
  searchParams.set('url', targetUrl);
  if (browser) searchParams.set('browser', browser);
  return `mylaunch://openurl?${searchParams.toString()}`;
}

/**
 * Ouvre une URL dans le navigateur utilisé pour le portail (détecté ou fourni),
 * avec le port 6000 autorisé, via le serveur local ou le protocole mylaunch://.
 */
export async function launchOpenUrlInBrowser(
  targetUrl: string,
  browser?: OpenUrlBrowser | null
): Promise<{ success: boolean; error?: string }> {
  const detected = browser ?? getCurrentBrowser();
  try {
    // En environnements multi-sessions (ex: Citrix), un serveur local sur localhost:8765
    // peut être partagé entre utilisateurs. On permet donc de forcer l'utilisation du
    // protocole mylaunch:// via une variable d'environnement.
    const transport = process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT;
    const allowLocalServer = transport !== 'protocol';

    try {
      if (!allowLocalServer) throw new Error('Local launcher server disabled by configuration');
      const serverUrl = new URL('http://localhost:8765/launch');
      serverUrl.searchParams.set('tool', 'openurl');
      serverUrl.searchParams.set('url', targetUrl);
      if (detected) serverUrl.searchParams.set('browser', detected);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(serverUrl.toString(), { method: 'GET', signal: controller.signal, cache: 'no-cache' });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return { success: data.success !== false, error: data.error };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch {
      window.location.href = buildOpenUrlInBrowserUrl(targetUrl, detected);
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur lors du lancement de l\'URL dans le navigateur:', error);
    return { success: false, error: 'Impossible d\'ouvrir le lien. Vérifiez que le launcher (mylaunch://) est installé.' };
  }
}

/**
 * Port launcher par utilisateur (Citrix) — doit rester identique a Get-HarpUserLauncherPort (PowerShell).
 * Plage 8800-8999.
 */
export function getLauncherPortForUser(netidOrUsername?: string | null): number {
  let name = (netidOrUsername || "default").trim().toLowerCase();
  if (name.includes("\\")) name = name.split("\\").pop() || name;
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return 8800 + (sum % 200);
}

function getCachedLauncherPort(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem("harp_launcher_port");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 8800 && n <= 8999 ? n : null;
}

function setCachedLauncherPort(port: number) {
  try {
    sessionStorage.setItem("harp_launcher_port", String(port));
  } catch {
    /* ignore */
  }
}

async function probeHealth(
  port: number,
  timeoutMs: number
): Promise<{ ok: boolean; health?: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-cache",
      mode: "cors",
    });
    clearTimeout(timeoutId);
    if (!response.ok) return { ok: false };
    try {
      const data = await response.json();
      return { ok: true, health: data };
    } catch {
      return { ok: true };
    }
  } catch {
    clearTimeout(timeoutId);
    return { ok: false };
  }
}

/**
 * Trouve le port du launcher de CET utilisateur (hash netid + scan parallele + match health.user).
 */
export async function resolveLauncherPort(
  netidOrUsername?: string | null,
  timeoutMs: number = 400
): Promise<{ port: number; health?: any } | null> {
  const preferred = getLauncherPortForUser(netidOrUsername);
  const wantUser = (netidOrUsername || "")
    .trim()
    .toLowerCase()
    .split("\\")
    .pop() || "";
  const cached = getCachedLauncherPort();
  const candidates: number[] = [];
  if (cached) candidates.push(cached);
  for (let i = 0; i <= 30; i++) {
    const p = preferred + i > 8999 ? 8800 + ((preferred + i - 8800) % 200) : preferred + i;
    if (!candidates.includes(p)) candidates.push(p);
  }
  if (!candidates.includes(8765)) candidates.push(8765);

  const probes = await Promise.all(
    candidates.map(async (port) => {
      const probe = await probeHealth(port, timeoutMs);
      return { port, ok: probe.ok, health: probe.health };
    })
  );

  const okProbes = probes.filter((p) => p.ok);
  if (okProbes.length === 0) return null;

  // Priorite: health.user === netid Windows (critique Citrix multi-sessions)
  if (wantUser) {
    const matched = okProbes.find(
      (p) => p.health?.user && String(p.health.user).toLowerCase() === wantUser
    );
    if (matched) {
      setCachedLauncherPort(matched.port);
      return { port: matched.port, health: matched.health };
    }
  }

  const preferredHit = okProbes.find((p) => p.port === preferred);
  if (preferredHit) {
    setCachedLauncherPort(preferredHit.port);
    return { port: preferredHit.port, health: preferredHit.health };
  }

  const first = okProbes[0];
  setCachedLauncherPort(first.port);
  return { port: first.port, health: first.health };
}

/**
 * Lance une application externe via le serveur local (port par utilisateur 8800-8999).
 * Citrix sans registre: TOUJOURS prioriser localhost (ignorer protocol-only).
 */
export async function launchExternalTool(
  tool: ExternalTool,
  params?: Record<string, string | number | undefined>
): Promise<{ success: boolean; error?: string }> {
  const transport = process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT;
  // "protocol" seul etait utilise quand mylaunch:// etait dispo via GPO.
  // Sans droits registre Citrix, on force le serveur local.
  const allowProtocolFallback = transport === "auto";

  const netid =
    (params?.netid as string | undefined) ||
    (params?.user as string | undefined) ||
    null;

  const resolved = await resolveLauncherPort(netid);
  if (!resolved) {
    return {
      success: false,
      error: `Launcher non détecté (port attendu ~${getLauncherPortForUser(netid)}). Dans Citrix: start-launcher-server.bat puis vérifier W:\\portal\\HARP\\launcher\\launcher.port`,
    };
  }
  const port = resolved.port;

  const buildLaunchUrl = (format?: "html") => {
    const serverUrl = `http://localhost:${port}/launch?tool=${encodeURIComponent(tool)}`;
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "netid") {
          searchParams.append(key, String(value));
        }
      });
    }
    if (format) searchParams.set("format", format);
    const qs = searchParams.toString();
    return qs ? `${serverUrl}&${qs}` : serverUrl;
  };

  const tryFetchLaunch = async (): Promise<{ success: boolean; error?: string }> => {
    const fullUrl = buildLaunchUrl();
    console.info("[mylaunch] fetch", fullUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-cache",
        mode: "cors",
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { success: data.success !== false, error: data.error };
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  const tryNavigationLaunch = (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (typeof document === "undefined") {
        resolve({ success: false, error: "Pas de document (SSR)" });
        return;
      }
      const fullUrl = buildLaunchUrl("html");
      console.info("[mylaunch] navigation", fullUrl);
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText =
        "position:absolute;width:0;height:0;border:0;left:-9999px;top:-9999px";
      let settled = false;
      const finish = (ok: boolean, error?: string) => {
        if (settled) return;
        settled = true;
        try {
          iframe.remove();
        } catch {
          /* ignore */
        }
        resolve(ok ? { success: true } : { success: false, error });
      };

      iframe.onload = () => finish(true);
      document.body.appendChild(iframe);
      iframe.src = fullUrl;

      setTimeout(() => {
        if (settled) return;
        const popup = window.open(
          fullUrl,
          "harp_launcher_launch",
          "noopener,noreferrer,width=480,height=240"
        );
        if (popup) finish(true);
        else
          finish(
            false,
            "Impossible d'atteindre le launcher depuis le navigateur (fetch/iframe/popup bloques)."
          );
      }, 1200);
    });
  };

  try {
    try {
      return await tryFetchLaunch();
    } catch (fetchError) {
      console.warn("[mylaunch] fetch /launch echoue, essai iframe/popup:", fetchError);
      const navResult = await tryNavigationLaunch();
      if (navResult.success) return navResult;

      if (allowProtocolFallback) {
        const url = buildMyLaunchUrl(tool, params);
        const a = document.createElement("a");
        a.href = url;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      return {
        success: false,
        error:
          navResult.error ||
          `Le navigateur n'atteint pas http://localhost:${port}/launch. Ouvrez le portail DANS la session Citrix du launcher.`,
      };
    }
  } catch (error) {
    console.error("Erreur lors du lancement de l'outil externe:", error);
    return {
      success: false,
      error:
        "Impossible de lancer l'application. Vérifiez que le serveur launcher est démarré (start-launcher-server.bat).",
    };
  }
}

/**
 * Vérifie si le serveur local du launcher répond (port par utilisateur).
 */
export async function checkLauncherHealth(
  timeoutMs: number = 800,
  netidOrUsername?: string | null
): Promise<LauncherHealthCheckResult> {
  const resolved = await resolveLauncherPort(netidOrUsername, timeoutMs);
  if (resolved) {
    return { running: true, health: resolved.health };
  }
  return {
    running: false,
    error: `Timeout/unreachable (port ~${getLauncherPortForUser(netidOrUsername)})`,
  };
}

/**
 * Vérifie si un outil existe dans la base de données et est configuré
 * @param tool - Le nom de l'outil à vérifier
 * @param netid - Le netid de l'utilisateur
 * @param extraParams - Paramètres optionnels (ptversion requis pour pside/psdmt)
 */
export async function checkToolAvailability(
  tool: string,
  netid: string,
  extraParams?: Record<string, string | undefined>
): Promise<{ success: boolean; error?: string; toolInfo?: any }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const qs = new URLSearchParams({ tool, netid });
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          qs.set(k, String(v));
        }
      });
    }
    const response = await fetch(`${apiUrl}/api/launcher/tool?${qs.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      return { 
        success: false, 
        error: errorData.error || `Erreur HTTP ${response.status}` 
      };
    }
    
    const data = await response.json();
    if (data.success) {
      return { success: true, toolInfo: data };
    } else {
      return { success: false, error: data.error || 'Outil non disponible' };
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'outil:', error);
    return { 
      success: false, 
      error: 'Impossible de vérifier l\'outil. Vérifiez votre connexion.' 
    };
  }
}

