/**
 * Charge initiale GO LIVE : psadm* en lecture seule vers User, envsharp et harp*.
 * Mode initial : les destinations du pipeline doivent être vides.
 * Mode reprise : termine une charge interrompue sans purge et sans écraser les clés déjà créées.
 * S'arrête à la première étape en erreur. N'écrit jamais dans les tables psadm*.
 * harpmenurole n'est pas alimentée.
 */

import prisma from "@/lib/prisma";
import {
  insertTypeBases,
  importerLesStatus,
  importerLesHarproles,
  GenererLesMenus,
  importerLesHarpItems,
  importerLesPsoftVersions,
  importerLesPToolsVersions,
  migrateReleaseData,
  importerLesTypesEnv,
  importerLesTools,
  migrateServers,
  importerOraInstances,
  importListEnvs,
  updateInstanceServerIds,
  importerLesEnvServeurs,
  updateEnvsharpInstanceIds,
  updateEnvsharpOrarelease,
  importInstanceOra,
  updateReleaseEnvIds,
  importerLesEnvInfos,
  importerLesEnvDispos,
  importerLesMonitors,
  migrerLesUtilisateursNEW,
  migrerLesRolesUtilisateurs,
} from "@/actions/importharp";

type StepPayload = {
  success?: string | boolean;
  error?: string;
  info?: string;
  warning?: string;
};

type StepDefinition = {
  name: string;
  func: () => Promise<StepPayload>;
  step: number;
  /** Une erreur, ou un résultat sans succès en mode initial, arrête le pipeline. */
  mustSucceed: boolean;
};

/** Première charge, ou reprise d'une charge GO LIVE interrompue. */
export type GoLiveMode = "initial" | "reprise";

export type GoLiveResult = {
  success?: boolean;
  skipped?: boolean;
  blocked?: boolean;
  error?: string;
  failedStep?: string;
  mode?: GoLiveMode;
  userCount?: number;
  envCount?: number;
  portalAdminCount?: number;
  harpTablesStatus?: Record<string, number>;
  requiresPrismaMigration?: boolean;
  reason?: string;
  diagnostics?: Record<string, unknown>;
  results?: Array<{ step: number; name: string; result: StepPayload | null; error?: string }>;
  totalSteps?: number;
  completedSteps?: number;
};

/**
 * Destinations écrites par la charge initiale.
 * En mode initial, toute ligne déjà présente interdit le démarrage.
 * harpmenurole n'en fait pas partie : elle n'est pas alimentée.
 * Les tables applicatives (sessions, tâches, emails, notifications, harpevent)
 * n'en font pas partie non plus.
 */
const DESTINATION_TABLES = [
  "user",
  "harptypebase",
  "statutenv",
  "harproles",
  "harpmenus",
  "harpitems",
  "psoftversion",
  "ptoolsversion",
  "releaseenv",
  "harptypenv",
  "harptools",
  "harpserve",
  "harpinstance",
  "envsharp",
  "harpenvserv",
  "harpora",
  "harpenvinfo",
  "harpenvdispo",
  "harpmonitor",
  "harpuseroles",
] as const;

const FINAL_STEP_NAME = "Contrôle PORTAL_ADMIN";
const TOTAL_STEPS = 25;

/**
 * Ordre de la charge. importerLesMenuRoles n'est pas appelé.
 */
const IMPORT_FUNCTIONS: StepDefinition[] = [
  { name: "Types de bases", func: insertTypeBases, step: 1, mustSucceed: true },
  { name: "Statuts d'environnement", func: importerLesStatus, step: 2, mustSucceed: true },
  { name: "Rôles harproles", func: importerLesHarproles, step: 3, mustSucceed: true },
  { name: "Menus", func: GenererLesMenus, step: 4, mustSucceed: true },
  { name: "Items HARP", func: importerLesHarpItems, step: 5, mustSucceed: true },
  { name: "Versions PeopleSoft", func: importerLesPsoftVersions, step: 6, mustSucceed: false },
  { name: "Versions PeopleTools", func: importerLesPToolsVersions, step: 7, mustSucceed: false },
  { name: "Releases HARP", func: migrateReleaseData, step: 8, mustSucceed: false },
  { name: "Types d'environnement", func: importerLesTypesEnv, step: 9, mustSucceed: true },
  { name: "Outils", func: importerLesTools, step: 10, mustSucceed: false },
  { name: "Serveurs", func: migrateServers, step: 11, mustSucceed: false },
  { name: "Instances Oracle (SID)", func: importerOraInstances, step: 12, mustSucceed: false },
  { name: "Environnements envsharp", func: importListEnvs, step: 13, mustSucceed: true },
  { name: "Lien instance-serveur", func: updateInstanceServerIds, step: 14, mustSucceed: false },
  { name: "Liens environnement-serveur", func: importerLesEnvServeurs, step: 15, mustSucceed: false },
  { name: "envsharp.instanceId", func: updateEnvsharpInstanceIds, step: 16, mustSucceed: false },
  { name: "Version Oracle envsharp", func: updateEnvsharpOrarelease, step: 17, mustSucceed: false },
  { name: "Instances harpora", func: importInstanceOra, step: 18, mustSucceed: false },
  { name: "Release envsharp", func: updateReleaseEnvIds, step: 19, mustSucceed: false },
  { name: "Informations d'environnement", func: importerLesEnvInfos, step: 20, mustSucceed: false },
  { name: "Indisponibilités", func: importerLesEnvDispos, step: 21, mustSucceed: false },
  { name: "Monitors", func: importerLesMonitors, step: 22, mustSucceed: false },
  { name: "Utilisateurs", func: migrerLesUtilisateursNEW, step: 23, mustSucceed: true },
  { name: "Rôles utilisateurs", func: migrerLesRolesUtilisateurs, step: 24, mustSucceed: true },
];

let migrationExecuted = false;
let migrationInProgress = false;
let migrationPromise: Promise<GoLiveResult> | null = null;

/**
 * Compte les lignes d'une table moderne dont le nom est dans la liste fixe.
 */
async function countTable(tableName: (typeof DESTINATION_TABLES)[number]): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
    `SELECT COUNT(*) AS n FROM \`${tableName}\``
  );
  return Number(rows[0]?.n ?? 0);
}

/**
 * Indique qu'une fonction delta ou un seed a volontairement conservé les lignes déjà présentes.
 */
function isAlreadyPresent(result: StepPayload): boolean {
  const text = `${result.info ?? ""} ${result.warning ?? ""}`.toLowerCase();
  return (
    text.includes("déjà") ||
    text.includes("deja") ||
    text.includes("ignor") ||
    text.includes("aucun nouvel") ||
    text.includes("aucun nouveau") ||
    text.includes("existent déjà") ||
    text.includes("sont déjà")
  );
}

/**
 * Message d'échec d'une étape, ou null si l'étape peut être poursuivie.
 * En reprise, « déjà importé » est un succès. Une erreur reste bloquante.
 */
function failureMessage(
  step: StepDefinition,
  result: StepPayload | null,
  mode: GoLiveMode
): string | null {
  if (!result) {
    return `${step.name} n'a rien retourné`;
  }
  if (result.error) {
    return result.error;
  }
  if (result.success) {
    return null;
  }
  if (mode === "reprise" && isAlreadyPresent(result)) {
    return null;
  }
  if (step.mustSucceed) {
    return result.info || result.warning || `${step.name} ne s'est pas terminée avec succès`;
  }
  return null;
}

/**
 * Contrôles en lecture seule avant toute écriture moderne.
 * Le contrôle de vacuité des destinations ne s'applique qu'au mode initial.
 * Aucun mot de passe n'est lu ni journalisé, seulement des effectifs de format.
 */
async function precheckGoLive(
  mode: GoLiveMode
): Promise<{ ok: true; diagnostics: Record<string, unknown> } | { ok: false; error: string; diagnostics: Record<string, unknown> }> {
  const diagnostics: Record<string, unknown> = { mode };
  const occupied: Record<string, number> = {};

  for (const tableName of DESTINATION_TABLES) {
    const count = await countTable(tableName);
    if (count > 0) {
      occupied[tableName] = count;
    }
  }
  diagnostics.destinationsNonVides = occupied;

  if (mode === "initial" && Object.keys(occupied).length > 0) {
    return {
      ok: false,
      error: "Charge initiale refusée : des tables modernes de destination contiennent déjà des données. Aucune écriture n'a été faite. Aucune purge automatique n'est exécutée. Utilisez le mode reprise pour terminer une charge interrompue.",
      diagnostics,
    };
  }

  const sources = await prisma.$queryRaw<Array<{
    users: bigint;
    envs: bigint;
    servers: bigint;
    rolesrv: bigint;
    oracleRows: bigint;
    envinfo: bigint;
    dispos: bigint;
    versions: bigint;
    ptools: bigint;
    releases: bigint;
    typenv: bigint;
    roleuser: bigint;
  }>>`
    SELECT
      (SELECT COUNT(*) FROM psadm_user) AS users,
      (SELECT COUNT(*) FROM psadm_env) AS envs,
      (SELECT COUNT(*) FROM psadm_srv) AS servers,
      (SELECT COUNT(*) FROM psadm_rolesrv) AS rolesrv,
      (SELECT COUNT(*) FROM psadm_oracle) AS oracleRows,
      (SELECT COUNT(*) FROM psadm_envinfo) AS envinfo,
      (SELECT COUNT(*) FROM psadm_dispo) AS dispos,
      (SELECT COUNT(*) FROM psadm_version) AS versions,
      (SELECT COUNT(*) FROM psadm_ptools) AS ptools,
      (SELECT COUNT(*) FROM psadm_release) AS releases,
      (SELECT COUNT(*) FROM psadm_typenv) AS typenv,
      (SELECT COUNT(*) FROM psadm_roleuser) AS roleuser
  `;
  const source = sources[0];
  diagnostics.sources = {
    psadm_user: Number(source?.users ?? 0),
    psadm_env: Number(source?.envs ?? 0),
    psadm_srv: Number(source?.servers ?? 0),
    psadm_rolesrv: Number(source?.rolesrv ?? 0),
    psadm_oracle: Number(source?.oracleRows ?? 0),
    psadm_envinfo: Number(source?.envinfo ?? 0),
    psadm_dispo: Number(source?.dispos ?? 0),
    psadm_version: Number(source?.versions ?? 0),
    psadm_ptools: Number(source?.ptools ?? 0),
    psadm_release: Number(source?.releases ?? 0),
    psadm_typenv: Number(source?.typenv ?? 0),
    psadm_roleuser: Number(source?.roleuser ?? 0),
  };

  if (Number(source?.users ?? 0) === 0) {
    return { ok: false, error: "Charge initiale refusée : psadm_user est vide.", diagnostics };
  }
  if (Number(source?.envs ?? 0) === 0) {
    return { ok: false, error: "Charge initiale refusée : psadm_env est vide.", diagnostics };
  }

  const emailDup = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*) AS n FROM (
      SELECT LOWER(TRIM(email)) AS mail
      FROM psadm_user
      WHERE email IS NOT NULL AND TRIM(email) <> ''
      GROUP BY LOWER(TRIM(email))
      HAVING COUNT(*) > 1
    ) d
  `;
  const duplicateEmailGroups = Number(emailDup[0]?.n ?? 0);
  diagnostics.duplicateEmailGroups = duplicateEmailGroups;
  if (duplicateEmailGroups > 0) {
    return {
      ok: false,
      error: "Charge initiale refusée : des emails sont partagés par plusieurs netid. createMany/skipDuplicates omettrait des comptes sans les nommer.",
      diagnostics,
    };
  }

  const adminFormats = await prisma.$queryRaw<Array<{
    candidats: bigint;
    dans_user: bigint;
    mysql_hash: bigint;
    bcrypt: bigint;
    vide: bigint;
    disabled: bigint;
    autre: bigint;
  }>>`
    SELECT
      COUNT(*) AS candidats,
      SUM(u.netid IS NOT NULL) AS dans_user,
      SUM(u.mdp REGEXP '^\\\\*[0-9A-Fa-f]{40}$') AS mysql_hash,
      SUM(u.mdp REGEXP '^\\\\$2[aby]\\\\$') AS bcrypt,
      SUM(u.netid IS NOT NULL AND (u.mdp IS NULL OR u.mdp = '')) AS vide,
      SUM(u.mdp LIKE 'DISABLED\\\\_%') AS disabled,
      SUM(
        u.netid IS NOT NULL
        AND u.mdp IS NOT NULL AND u.mdp <> ''
        AND u.mdp NOT REGEXP '^\\\\*[0-9A-Fa-f]{40}$'
        AND u.mdp NOT REGEXP '^\\\\$2[aby]\\\\$'
        AND u.mdp NOT LIKE 'DISABLED\\\\_%'
      ) AS autre
    FROM psadm_roleuser r
    LEFT JOIN psadm_user u ON u.netid = r.netid
    WHERE r.role = 'PORTAL_ADMIN'
  `;
  const admin = adminFormats[0];
  const portalAdminCandidates = Number(admin?.candidats ?? 0);
  const authenticable = Number(admin?.mysql_hash ?? 0) + Number(admin?.bcrypt ?? 0);
  diagnostics.portalAdmin = {
    candidats: portalAdminCandidates,
    presentsDansPsadmUser: Number(admin?.dans_user ?? 0),
    mysqlHash: Number(admin?.mysql_hash ?? 0),
    bcrypt: Number(admin?.bcrypt ?? 0),
    vide: Number(admin?.vide ?? 0),
    disabled: Number(admin?.disabled ?? 0),
    autre: Number(admin?.autre ?? 0),
  };

  if (portalAdminCandidates === 0 || Number(admin?.dans_user ?? 0) === 0) {
    return {
      ok: false,
      error: "BLOQUANT GO LIVE : aucun candidat PORTAL_ADMIN présent à la fois dans psadm_roleuser et psadm_user.",
      diagnostics,
    };
  }
  if (authenticable === 0) {
    return {
      ok: false,
      error: "BLOQUANT GO LIVE : aucun candidat PORTAL_ADMIN n'a un mot de passe au format accepté par verifyPassword (hash MySQL ou bcrypt). Aucune valeur secrète n'a été lue.",
      diagnostics,
    };
  }

  return { ok: true, diagnostics };
}

/**
 * Vérifie qu'au moins un User moderne est relié à harproles.role = PORTAL_ADMIN.
 * Ne lit pas les mots de passe.
 */
async function countModernPortalAdmins(): Promise<number> {
  return prisma.user.count({
    where: {
      harpuseroles: {
        some: {
          harproles: { role: "PORTAL_ADMIN" },
        },
      },
    },
  });
}

/**
 * Charge initiale GO LIVE, ou reprise d'une charge interrompue.
 * Les tables psadm* sont lues, jamais mises à jour.
 * En cas d'échec, les étapes suivantes ne sont pas exécutées
 * et les lignes modernes déjà écrites sont conservées.
 *
 * @param mode - `initial` exige des destinations vides. `reprise` poursuit une charge partielle.
 * @returns Diagnostic de pré-check, ou le résultat de la charge
 */
export async function ensureFullDatabaseMigration(
  mode: GoLiveMode = "initial"
): Promise<GoLiveResult> {
  if (mode !== "initial" && mode !== "reprise") {
    return {
      success: false,
      blocked: true,
      error: "Mode GO LIVE inconnu. Valeurs acceptées : initial, reprise.",
      failedStep: "pré-check",
    };
  }

  if (migrationInProgress && migrationPromise) {
    console.log("[GO LIVE] Charge déjà en cours, réutilisation de la promesse...");
    return migrationPromise;
  }

  if (migrationExecuted) {
    return {
      skipped: true,
      mode,
      reason: "Charge GO LIVE déjà exécutée dans ce processus",
    };
  }

  migrationPromise = (async () => {
    try {
      migrationInProgress = true;

      try {
        await prisma.user.count();
      } catch {
        migrationInProgress = false;
        migrationPromise = null;
        return {
          success: false,
          mode,
          error: "La table User n'existe pas encore. Veuillez exécuter 'npx prisma db push' ou 'npx prisma migrate dev' pour créer les tables.",
          requiresPrismaMigration: true,
        };
      }

      const precheck = await precheckGoLive(mode);
      console.log(`[GO LIVE] Pré-check (${mode}) :`, JSON.stringify(precheck.diagnostics));
      if (!precheck.ok) {
        console.error("[GO LIVE] Pré-check bloquant :", precheck.error);
        migrationInProgress = false;
        migrationPromise = null;
        return {
          success: false,
          blocked: true,
          mode,
          error: precheck.error,
          failedStep: "pré-check",
          diagnostics: precheck.diagnostics,
        };
      }

      const results: GoLiveResult["results"] = [];

      const stopAt = (
        stepName: string,
        error: string,
        extra: Partial<GoLiveResult> = {}
      ): GoLiveResult => {
        console.error(`[GO LIVE] Arrêt à l'étape ${stepName}:`, error);
        migrationInProgress = false;
        migrationPromise = null;
        return {
          success: false,
          blocked: true,
          mode,
          error,
          failedStep: stepName,
          diagnostics: precheck.diagnostics,
          results,
          totalSteps: TOTAL_STEPS,
          completedSteps: results.filter((item) => !item.error).length,
          ...extra,
        };
      };

      for (const step of IMPORT_FUNCTIONS) {
        try {
          console.log(`[GO LIVE] Étape ${step.step}/${TOTAL_STEPS} (${mode}): ${step.name}`);
          const result = await step.func();
          const error = failureMessage(step, result, mode);
          results.push({ step: step.step, name: step.name, result, error: error ?? undefined });

          if (error) {
            return stopAt(step.name, error);
          }

          if (step.func === importerLesHarproles) {
            const seeded = await prisma.harproles.count({ where: { role: "PORTAL_ADMIN" } });
            if (seeded < 1) {
              return stopAt(
                "Rôles harproles",
                "harproles ne contient pas PORTAL_ADMIN après le seed. Les étapes suivantes ne seront pas lancées."
              );
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          console.error(`[GO LIVE] Exception à l'étape ${step.step} (${step.name}):`, errorMessage);
          results.push({ step: step.step, name: step.name, result: null, error: errorMessage });
          return stopAt(step.name, errorMessage);
        }
      }

      const portalAdminCount = await countModernPortalAdmins();
      if (portalAdminCount < 1) {
        results.push({
          step: 25,
          name: FINAL_STEP_NAME,
          result: null,
          error: "BLOQUANT GO LIVE : aucun PORTAL_ADMIN moderne après migration",
        });
        return stopAt(
          FINAL_STEP_NAME,
          "BLOQUANT GO LIVE : aucun PORTAL_ADMIN moderne après migration",
          { portalAdminCount }
        );
      }

      results.push({
        step: 25,
        name: FINAL_STEP_NAME,
        result: { success: `${portalAdminCount} PORTAL_ADMIN moderne(s)` },
      });

      const harpTablesStatus: Record<string, number> = {};
      for (const tableName of DESTINATION_TABLES) {
        harpTablesStatus[tableName] = await countTable(tableName);
      }

      const userCount = harpTablesStatus.user ?? 0;
      const envCount = harpTablesStatus.envsharp ?? 0;
      console.log(`[GO LIVE] Charge terminée (${mode}). Utilisateurs: ${userCount}. Environnements: ${envCount}. PORTAL_ADMIN: ${portalAdminCount}.`);

      migrationExecuted = true;
      migrationInProgress = false;
      migrationPromise = null;

      return {
        success: true,
        mode,
        userCount,
        envCount,
        portalAdminCount,
        harpTablesStatus,
        diagnostics: precheck.diagnostics,
        results,
        totalSteps: TOTAL_STEPS,
        completedSteps: results.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[GO LIVE] Erreur critique:", errorMessage);
      migrationInProgress = false;
      migrationPromise = null;
      return { success: false, mode, error: errorMessage };
    }
  })();

  return migrationPromise;
}

/**
 * Réinitialise le flag de charge (utile pour un nouvel essai dans le même processus).
 */
export function resetFullMigrationFlag() {
  migrationExecuted = false;
  migrationInProgress = false;
  migrationPromise = null;
}

/**
 * Indique si une charge GO LIVE est en cours dans ce processus.
 */
export function isMigrationInProgress(): boolean {
  return migrationInProgress;
}

/**
 * Indique si une charge GO LIVE s'est terminée avec succès dans ce processus.
 */
export function isMigrationExecuted(): boolean {
  return migrationExecuted;
}
