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
 */
export function buildSimpleToolUrl(tool: 'psdmt' | 'pscfg' | 'sqlplus' | 'filezilla' | 'perl' | 'winscp' | 'winmerge'): string {
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
      return buildSimpleToolUrl(tool);
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

