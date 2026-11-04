/**
 * Ligne CSV env.* ou release.* déjà découpée, sans accès base ni fichier.
 */
export interface EnvCsvData {
  env: string;
  harprelease: string;
  refreshdt: string;
  datadt: string;
  modetp: string;
  modedt: string;
  cobver: string;
  deploycbl: string;
  orarelease: string;
  ptversion: string;
  psversion: string;
  anonym: string;
  infodt: string;
  dbstatus: string;
  nbdom: string;
  asstatus1: string;
  asstatus2: string;
  asstatus3: string;
  asstatus4: string;
  asstatus5: string;
  lastasdt: string;
  psunxstatus: string;
  psunxdt: string;
  psntstatus: string;
  psntdt: string;
  webstatus: string;
  login: string;
  logindt: string;
  pswd_ft_exploit: string;
  /** `undefined` si la colonne est absente du CSV ; chaîne vide si elle est présente mais vide. */
  pswd_oraquery: string | undefined;
  edi: string;
}

/** Famille de fichier refresh : env.* ou release.*. */
export type CsvFamily = "env" | "release";

/**
 * Construit les champs communs. FT_EXPLOIT reste à l'index 28.
 * ORAQUERY et EDI sont fournis par l'appelant selon la famille.
 *
 * @param fields - Cases déjà découpées
 * @param pswd_oraquery - Colonne ORAQUERY, ou undefined si elle est absente
 * @param edi - Valeur EDI déjà positionnée
 * @returns Ligne typée
 */
export function mapCsvFields(
  fields: string[],
  pswd_oraquery: string | undefined,
  edi: string
): EnvCsvData {
  return {
    env: fields[0] || '',
    harprelease: fields[1] || '',
    refreshdt: fields[2] || '',
    datadt: fields[3] || '',
    modetp: fields[4] || '',
    modedt: fields[5] || '',
    cobver: fields[6] || '',
    deploycbl: fields[7] || '',
    orarelease: fields[8] || '',
    ptversion: fields[9] || '',
    psversion: fields[10] || '',
    anonym: fields[11] || '',
    infodt: fields[12] || '',
    dbstatus: fields[13] || '',
    nbdom: fields[14] || '',
    asstatus1: fields[15] || '',
    asstatus2: fields[16] || '',
    asstatus3: fields[17] || '',
    asstatus4: fields[18] || '',
    asstatus5: fields[19] || '',
    lastasdt: fields[20] || '',
    psunxstatus: fields[21] || '',
    psunxdt: fields[22] || '',
    psntstatus: fields[23] || '',
    psntdt: fields[24] || '',
    webstatus: fields[25] || '',
    login: fields[26] || '',
    logindt: fields[27] || '',
    pswd_ft_exploit: fields[28] || '',
    pswd_oraquery,
    edi,
  };
}

/**
 * Parse une ligne CSV avec séparateur ';'.
 * release : 30 champs, ou 31 si le dernier est un séparateur final vide. ORAQUERY absent.
 * env : 31 champs avec EDI non vide, 32 avec un seul séparateur final vide, ou 30 champs historiques.
 * Une ligne env de 31 champs à dernière case vide est rejetée.
 *
 * @param line - Ligne brute
 * @param family - Famille du fichier, env ou release
 * @returns Données parsées, ou null si le format est refusé
 */
export function parseCsvLine(line: string, family: CsvFamily): EnvCsvData | null {
  const parts = line.split(';');

  if (family === "release") {
    const fields = parts.length === 31 && parts[30] === '' ? parts.slice(0, 30) : parts;
    if (fields.length !== 30) {
      return null;
    }
    return mapCsvFields(fields, undefined, fields[29] || '');
  }

  const fields = parts.length === 32 && parts[31] === '' ? parts.slice(0, 31) : parts;
  if (fields.length === 31 && fields[30] === '') {
    return null;
  }
  if (fields.length === 30) {
    return mapCsvFields(fields, undefined, fields[29] || '');
  }
  if (fields.length === 31) {
    return mapCsvFields(fields, fields[29] || '', fields[30] || '');
  }
  return null;
}
