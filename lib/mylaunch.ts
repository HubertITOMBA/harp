/**
 * Utilitaire pour construire les URLs du protocole mylaunch://
 * Utilisé pour lancer des applications Windows locales depuis le navigateur
 */

export type ExternalTool = 'putty' | 'pside' | 'ptsmt';

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

/**
 * Construit une URL mylaunch:// pour lancer PuTTY
 */
export function buildPuttyUrl(params: PuttyParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.host) searchParams.set('host', params.host);
  if (params.user) searchParams.set('user', params.user);
  if (params.port) searchParams.set('port', String(params.port));
  if (params.sshkey) searchParams.set('sshkey', params.sshkey);
  
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
    default:
      throw new Error(`Outil non supporté: ${tool}`);
  }
}

/**
 * Lance une application externe via le protocole mylaunch://
 * Retourne true si le lien a été créé, false sinon
 */
export function launchExternalTool(
  tool: ExternalTool,
  params?: Record<string, string | number | undefined>
): boolean {
  try {
    const url = buildMyLaunchUrl(tool, params);
    window.location.href = url;
    return true;
  } catch (error) {
    console.error('Erreur lors du lancement de l\'outil externe:', error);
    return false;
  }
}

