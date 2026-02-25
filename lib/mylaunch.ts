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
export function buildSimpleToolUrl(
  tool: 'psdmt' | 'pscfg' | 'sqlplus' | 'filezilla' | 'perl' | 'winscp' | 'winmerge',
  params?: Record<string, string | number | undefined>
): string {
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

/**
 * Construit une URL mylaunch://openurl pour ouvrir une URL dans Edge/Chrome
 * avec le port 6000 autorisé (évite ERR_UNSAFE_PORT). Le launcher lance le
 * navigateur avec --explicitly-allowed-ports=6000.
 */
export function buildOpenUrlInBrowserUrl(targetUrl: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set('url', targetUrl);
  return `mylaunch://openurl?${searchParams.toString()}`;
}

/**
 * Ouvre une URL dans le navigateur (Edge prioritaire, puis Chrome) avec le port 6000
 * autorisé, via le serveur local ou le protocole mylaunch://. Pas de toast ni message
 * pour l'utilisateur.
 */
export async function launchOpenUrlInBrowser(targetUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const serverUrl = `http://localhost:8765/launch?tool=openurl&url=${encodeURIComponent(targetUrl)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(serverUrl, { method: 'GET', signal: controller.signal, cache: 'no-cache' });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return { success: data.success !== false, error: data.error };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch {
      window.location.href = buildOpenUrlInBrowserUrl(targetUrl);
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur lors du lancement de l\'URL dans le navigateur:', error);
    return { success: false, error: 'Impossible d\'ouvrir le lien. Vérifiez que le launcher (mylaunch://) est installé.' };
  }
}

/**
 * Lance une application externe via le serveur local ou le protocole mylaunch://
 * 
 * Cette fonction essaie d'abord d'utiliser le serveur HTTP local (port 8765),
 * et si celui-ci n'est pas disponible, utilise le protocole mylaunch://
 * 
 * @param tool - Le nom de l'outil à lancer
 * @param params - Les paramètres optionnels pour l'outil
 * @returns Promise<{ success: boolean; error?: string }> - Résultat du lancement
 */
export async function launchExternalTool(
  tool: ExternalTool,
  params?: Record<string, string | number | undefined>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Essayer d'abord le serveur HTTP local (sans protocole personnalisé)
    try {
      const serverUrl = `http://localhost:8765/launch?tool=${encodeURIComponent(tool)}`;
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
      }
      
      const fullUrl = searchParams.toString() 
        ? `${serverUrl}&${searchParams.toString()}`
        : serverUrl;
      
      // Essayer de contacter le serveur local
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // Timeout de 1 seconde
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return { success: data.success !== false, error: data.error };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Si le serveur n'est pas disponible, utiliser le protocole mylaunch://
        throw fetchError;
      }
    } catch (serverError) {
      // Si le serveur local n'est pas disponible, utiliser le protocole mylaunch://
      console.log('Serveur local non disponible, utilisation du protocole mylaunch://');
      
      const url = buildMyLaunchUrl(tool, params);
      window.location.href = url;
      
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur lors du lancement de l\'outil externe:', error);
    return { 
      success: false, 
      error: 'Impossible de lancer l\'application. Vérifiez que le serveur launcher est démarré ou que le protocole mylaunch:// est installé.' 
    };
  }
}

/**
 * Vérifie si un outil existe dans la base de données et est configuré
 * @param tool - Le nom de l'outil à vérifier
 * @param netid - Le netid de l'utilisateur
 * @returns Promise avec les informations de l'outil ou une erreur
 */
export async function checkToolAvailability(
  tool: string,
  netid: string
): Promise<{ success: boolean; error?: string; toolInfo?: any }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const response = await fetch(`${apiUrl}/api/launcher/tool?tool=${encodeURIComponent(tool)}&netid=${encodeURIComponent(netid)}`);
    
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

