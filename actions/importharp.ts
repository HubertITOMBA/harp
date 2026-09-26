"use server";

import { requirePortalAdmin } from "@/lib/require-portal-admin";
import * as migration from "@/lib/harp-import-core";

/**
 * Résultat d'un import, vu par les pages Web.
 * Les champs sont optionnels : chaque fonction n'en remplit qu'une partie.
 */
type HarpImportOutcome = {
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
  details?: {
    imported?: number;
    ignoredRecords?: number;
    ignoredEnvironments?: number;
    [key: string]: unknown;
  };
};

const outcome = migration as {
  [K in keyof typeof migration]: (typeof migration)[K] extends (...args: infer A) => unknown
    ? (...args: A) => Promise<HarpImportOutcome>
    : (typeof migration)[K];
};

/**
 * Frontière Web des imports GO LIVE.
 * Chaque export exige PORTAL_ADMIN, puis délègue à la logique métier.
 * Le métier ne reçoit aucun drapeau permettant d'ignorer ce contrôle.
 */

/**
 * Seed des types de base, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const insertTypeBases = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.insertTypeBases();
};

/**
 * Seed des statuts d'environnement, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesStatus = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesStatus();
};

/**
 * Met à jour les identifiants de disponibilité, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const updateDispoEnvIds = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.updateDispoEnvIds();
};

/**
 * Initialise les valeurs par défaut, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const initDefaultValues = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.initDefaultValues();
};

/**
 * Génère les menus, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const GenererLesMenus = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.GenererLesMenus();
};

/**
 * Lie les types d'environnement, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const lierTypeEnvs = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.lierTypeEnvs();
};

/**
 * Lie les environnements à leur type, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const lierEnvauTypeEnv = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.lierEnvauTypeEnv();
};

/**
 * Importe les rôles HARP, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesHarproles = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesHarproles();
};

/**
 * Importe les environnements, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export async function importListEnvs(): Promise<HarpImportOutcome> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importListEnvs();
}

/**
 * Force l'import d'environnements nommés, réservé à PORTAL_ADMIN.
 * @param envNames - Noms à importer, ou la liste par défaut du métier
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export async function forceImportSpecificEnvs(envNames?: string[]): Promise<HarpImportOutcome> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.forceImportSpecificEnvs(envNames);
}

/**
 * Importe les instances Oracle, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importInstanceOra = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importInstanceOra();
};

/**
 * Importe les instances Oracle (variante), réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerInstancesOracle = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerInstancesOracle();
};

/**
 * Synchronise les utilisateurs manquants, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export async function migrerLesUtilisateurs(): Promise<HarpImportOutcome> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrerLesUtilisateurs();
}

/**
 * Migre les rôles utilisateurs, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const migrerLesRolesUtilisateurs = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrerLesRolesUtilisateurs();
};

/**
 * Vérifie les doublons de SID Oracle (variante 1), réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const verifierDoublonsOracleSid1 = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.verifierDoublonsOracleSid1();
};

/**
 * Vérifie les doublons de SID Oracle, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const verifierDoublonsOracleSid = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.verifierDoublonsOracleSid();
};

/**
 * Importe les versions PeopleSoft, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesPsoftVersions = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesPsoftVersions();
};

/**
 * Importe les versions PeopleTools, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesPToolsVersions = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesPToolsVersions();
};

/**
 * Migre les releases, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const migrateReleaseData = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrateReleaseData();
};

/**
 * Importe les types d'environnement, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesTypesEnv = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesTypesEnv();
};

/**
 * Met à jour les releases des environnements, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const updateReleaseEnvIds = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.updateReleaseEnvIds();
};

/**
 * Migre les serveurs, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const migrateServers = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrateServers();
};

/**
 * Migre les données vers envsharp, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const migrateDataToEnvsharp = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrateDataToEnvsharp();
};

/**
 * Migration initiale des utilisateurs, réservée à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const migrerLesUtilisateursNEW = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.migrerLesUtilisateursNEW();
};

/**
 * Ancien import des informations d'environnement, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const OLD_importerLesEnvInfos = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.OLD_importerLesEnvInfos();
};

/**
 * Importe les informations d'environnement, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesEnvInfos = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesEnvInfos();
};

/**
 * Importe les instances Oracle SID, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerOraInstances = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerOraInstances();
};

/**
 * Met à jour les serveurs d'instance, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const updateInstanceServerIds = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.updateInstanceServerIds();
};

/**
 * Importe les liens environnement-serveur, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesEnvServeurs = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesEnvServeurs();
};

/**
 * Met à jour envsharp.instanceId, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const updateEnvsharpInstanceIds = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.updateEnvsharpInstanceIds();
};

/**
 * Met à jour la version Oracle des environnements, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const updateEnvsharpOrarelease = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.updateEnvsharpOrarelease();
};

/**
 * Importe les indisponibilités, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesEnvDispos = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesEnvDispos();
};

/**
 * Importe les outils, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesTools = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesTools();
};

/**
 * Importe les rôles utilisateurs historiques, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesUserRoles = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesUserRoles();
};

/**
 * Importe les rôles de menus, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesMenuRoles = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesMenuRoles();
};

/**
 * Importe les moniteurs, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesMonitors = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesMonitors();
};

/**
 * Importe les items HARP, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesHarpItems = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesHarpItems();
};

/**
 * Importe les liens PUM environnement-serveur, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerEnvServeursPUM = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerEnvServeursPUM();
};

/**
 * Importe les informations PUM, réservé à PORTAL_ADMIN.
 * @returns Résultat métier, ou refus avant tout accès aux données
 */
export const importerLesEnvPUMInfos = async (): Promise<HarpImportOutcome> => {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { error: admin.error };
  }
  return outcome.importerLesEnvPUMInfos();
};
