const HOST_MAX_LENGTH = 253;

/**
 * Indique si une chaîne est une IPv4 utilisable comme cible SSH.
 *
 * @param host - Valeur déjà trimée
 */
function isIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) {
    return false;
  }
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}

/**
 * Indique si une chaîne est un hostname ou un FQDN interne.
 * Tiret en début ou fin de label, et tout métacaractère, sont refusés.
 *
 * @param host - Valeur déjà trimée
 */
function isHostname(host: string): boolean {
  if (host.length > HOST_MAX_LENGTH) {
    return false;
  }
  const labels = host.split(".");
  if (labels.length === 0) {
    return false;
  }
  return labels.every((label) =>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)
  );
}

/**
 * Normalise une cible SSH libre saisie sur /hub.
 * Accepte une IPv4, un hostname ou un FQDN. Refuse le vide et l'injection.
 *
 * @param value - Hôte fourni par le navigateur
 * @returns Hôte trimé, ou null si la cible est inutilisable
 */
export function normalizeFreeSshHost(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const host = value.trim();
  if (host === "" || host.length > HOST_MAX_LENGTH) {
    return null;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return isIpv4(host) ? host : null;
  }
  if (isHostname(host)) {
    return host;
  }
  return null;
}
