/**
 * Utilitaires PeopleTools (chemins client Windows).
 * Source de vérité partagée entre API launcher et UI (PSIDE / PSDMT).
 */

export type PeopleToolsVersionResult =
  | { ok: true; display: string; folderSuffix: string }
  | { ok: false; error: string };

/** Exécutables autorisés pour les outils client PeopleSoft (indépendant de harptools.cmd). */
export const PEOPLESOFT_TOOL_EXE: Record<string, string> = {
  pside: "pside.exe",
  psdmt: "psdmt.exe",
};

/**
 * Valide et normalise une Version PTools (ex. "8.61" → suffixe "861" → dossier pt861).
 *
 * Format métier attendu : X.YY (exemple : 8.61, 8.62).
 * Transformation textuelle uniquement (pas de conversion numérique) pour conserver
 * les zéros significatifs (8.60 → 860 → pt860).
 *
 * @param raw - Valeur issue de l'environnement (envsharp.ptversion)
 */
export function normalizePeopleToolsVersion(
  raw: string | null | undefined
): PeopleToolsVersionResult {
  if (raw === null || raw === undefined) {
    return {
      ok: false,
      error:
        "Version PTools manquante pour cet environnement. Impossible de lancer l'outil PeopleSoft.",
    };
  }

  const display = String(raw).trim();
  if (!display) {
    return {
      ok: false,
      error:
        "Version PTools vide pour cet environnement. Impossible de lancer l'outil PeopleSoft.",
    };
  }

  if (/^(n\/?a|null|undefined|-)$/i.test(display)) {
    return {
      ok: false,
      error: `Version PTools invalide (« ${display} »). Renseignez une version au format X.YY (exemple : 8.61).`,
    };
  }

  // Refuser path traversal / séparateurs avant toute normalisation
  if (/[\\/]|\.\./.test(display)) {
    return {
      ok: false,
      error: `Version PTools invalide (« ${display} ») : caractères de chemin non autorisés.`,
    };
  }

  // Format strict métier : X.YY (ex. 8.60, 8.61) — pas de patch 8.61.01 / 8.61.13
  if (!/^\d+\.\d{2}$/.test(display)) {
    return {
      ok: false,
      error: `Format de Version PTools non reconnu (« ${display} »). Attendu: X.YY (exemple : 8.61).`,
    };
  }

  // Transformation textuelle (jamais Number/parseFloat) pour conserver le zéro de 8.60
  const folderSuffix = display.replace(/\./g, "");
  // Ceinture + bretelles : uniquement des chiffres dans le segment de dossier
  if (!/^\d{3,}$/.test(folderSuffix)) {
    return {
      ok: false,
      error: `Format de Version PTools non reconnu (« ${display} »). Attendu: X.YY (exemple : 8.61).`,
    };
  }

  return { ok: true, display, folderSuffix };
}

/**
 * Construit le chemin client PeopleSoft sous D:\apps\peoplesoft\ptXXX\...
 * L'exécutable est fixé par l'outil (pside.exe / psdmt.exe), pas par harptools.cmd.
 *
 * @param tool - "pside" | "psdmt"
 * @param folderSuffix - Ex. "861" pour pt861
 */
export function buildPeopleSoftClientPath(
  tool: keyof typeof PEOPLESOFT_TOOL_EXE,
  folderSuffix: string
): string {
  const exe = PEOPLESOFT_TOOL_EXE[tool];
  if (!exe) {
    throw new Error(`Outil PeopleSoft non supporté pour le chemin client: ${tool}`);
  }
  if (!/^\d{3,}$/.test(folderSuffix)) {
    throw new Error(`Suffixe PeopleTools invalide: ${folderSuffix}`);
  }
  return `D:\\apps\\peoplesoft\\pt${folderSuffix}\\bin\\client\\winx86\\${exe}`;
}

/**
 * Indique si la valeur est utilisable pour un lancement (côté UI).
 */
export function isUsablePeopleToolsVersion(
  raw: string | null | undefined
): boolean {
  return normalizePeopleToolsVersion(raw).ok;
}
