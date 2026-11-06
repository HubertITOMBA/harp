"use server"

import { db } from "@/lib/db";
import {
  HarpDisplayLockError,
  withHarpDisplayLock,
  type HarpDisplayLockClient,
} from "@/lib/harp-display-lock";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FAMILY_LOCK_MIN = 1;
const FAMILY_LOCK_MAX = 32767;

const UpdateEnvSchema = z.object({
  env: z.string().min(1, "Le nom de l'environnement est requis"),
  aliasql: z.string().max(32).optional().or(z.literal("")),
  oraschema: z.string().max(8).optional().or(z.literal("")),
  orarelease: z.string().max(32).optional().or(z.literal("")),
  url: z.string().max(255).optional().or(z.literal("")),
  appli: z.string().max(2).optional().or(z.literal("")),
  psversion: z.string().max(50).optional().or(z.literal("")),
  ptversion: z.string().max(50).optional().or(z.literal("")),
  harprelease: z.string().max(20).optional().or(z.literal("")),
  pshome: z.string().max(32).optional().or(z.literal("")),
  volum: z.string().max(60).optional().or(z.literal("")),
  descr: z.string().max(255).optional().or(z.literal("")),
  anonym: z.string().max(1).optional().or(z.literal("")),
  edi: z.string().max(1).optional().or(z.literal("")),
  typenvid: z.string().optional(),
  statenvId: z.string().optional(),
});

type EnvInput = z.infer<typeof UpdateEnvSchema>;

type EnvRow = {
  typenvid: number | null;
  statenvId: number | null;
};

type EnvUpdateResult =
  | { updated: true }
  | { updated: false; error: string };

/**
 * Indique si la valeur demandée est un identifiant de famille verrouillable.
 * null, NaN et les entiers hors 1–32767 ne prennent pas le verrou.
 *
 * @param typenvid - Résultat de parseInt, ou null si le champ est absent
 * @returns true pour un entier de 1 à 32767
 */
function isLockableFamilyId(typenvid: number | null): typenvid is number {
  return (
    typeof typenvid === "number" &&
    Number.isInteger(typenvid) &&
    typenvid >= FAMILY_LOCK_MIN &&
    typenvid <= FAMILY_LOCK_MAX
  );
}

/**
 * Construit les colonnes écrites par la mise à jour.
 * Les chaînes vides deviennent null, comme avant.
 * typenvid n'est présent que lorsqu'une valeur explicite doit être écrite.
 *
 * @param data - Champs validés
 * @param typenvid - Valeur explicite, ou undefined pour ne pas toucher la colonne
 * @param statenvId - Statut réellement écrit
 * @returns Données Prisma de mise à jour
 */
function envUpdateData(
  data: EnvInput,
  typenvid: number | null | undefined,
  statenvId: number | null,
) {
  return {
    aliasql: data.aliasql || null,
    oraschema: data.oraschema || null,
    orarelease: data.orarelease || null,
    url: data.url || null,
    appli: data.appli || null,
    psversion: data.psversion || null,
    ptversion: data.ptversion || null,
    harprelease: data.harprelease || null,
    pshome: data.pshome || null,
    volum: data.volum || null,
    descr: data.descr || null,
    anonym: data.anonym || null,
    edi: data.edi || null,
    ...(typenvid === undefined ? {} : { typenvid }),
    statenvId,
  };
}

/**
 * Relit l'environnement puis écrit les champs demandés.
 * Le typenvid explicite est celui du verrou déjà acquis.
 *
 * @param client - Transaction qui tient le verrou
 * @param env - Nom de l'environnement
 * @param data - Champs validés
 * @param typenvid - Identifiant de famille explicitement demandé
 * @param statenvId - Statut demandé, ou null pour conserver la valeur relue
 * @returns Mise à jour, ou environnement introuvable
 */
async function writeLockedEnvUpdate(
  client: HarpDisplayLockClient,
  env: string,
  data: EnvInput,
  typenvid: number,
  statenvId: number | null,
): Promise<EnvUpdateResult> {
  const fresh = await client.envsharp.findUnique({
    where: { env },
  });

  if (!fresh) {
    return { updated: false, error: "Environnement non trouvé" };
  }

  await client.envsharp.update({
    where: { env },
    data: envUpdateData(
      data,
      typenvid,
      statenvId !== null ? statenvId : fresh.statenvId,
    ),
  });

  return { updated: true };
}

/**
 * Met à jour un environnement sans changer de famille verrouillable.
 * Un champ absent ou vide n'écrit pas typenvid : la colonne reste celle
 * déjà validée, y compris par une autre transaction. Si le typenvid
 * demandé est déjà celui de la ligne, l'écriture est conditionnelle.
 *
 * @param env - Nom de l'environnement
 * @param data - Champs validés
 * @param requestedTypenvId - parseInt du champ, ou null s'il est absent ou vide
 * @param statenvId - parseInt du statut, ou null s'il est absent
 * @param existingEnv - Ligne lue avant l'écriture
 * @returns true si l'écriture sans verrou a abouti
 */
async function keepEnvFamily(
  env: string,
  data: EnvInput,
  requestedTypenvId: number | null,
  statenvId: number | null,
  existingEnv: EnvRow,
): Promise<boolean> {
  const typenvid = requestedTypenvId !== null ? requestedTypenvId : undefined;
  const writtenStatus = statenvId !== null ? statenvId : existingEnv.statenvId;
  const sameLockableFamily = isLockableFamilyId(requestedTypenvId)
    && existingEnv.typenvid === requestedTypenvId;

  if (sameLockableFamily) {
    const kept = await db.envsharp.updateMany({
      where: { env, typenvid: requestedTypenvId },
      data: envUpdateData(data, requestedTypenvId, writtenStatus),
    });
    return kept.count === 1;
  }

  await db.envsharp.update({
    where: { env },
    data: envUpdateData(data, typenvid, writtenStatus),
  });
  return true;
}

/**
 * Met à jour un environnement envsharp.
 * PORTAL_ADMIN est exigé. Un typenvid explicite de 1 à 32767, différent
 * de la valeur déjà enregistrée, est verrouillé avant la relecture et
 * l'écriture. L'absence du champ, ou un champ vide, n'écrit pas typenvid.
 *
 * @param env - Nom de l'environnement
 * @param formData - Champs du formulaire
 * @returns Succès avec message, ou un refus
 */
export async function updateEnv(env: string, formData: FormData) {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  try {
    const rawData = {
      aliasql: formData.get("aliasql") as string || undefined,
      oraschema: formData.get("oraschema") as string || undefined,
      orarelease: formData.get("orarelease") as string || undefined,
      url: formData.get("url") as string || undefined,
      appli: formData.get("appli") as string || undefined,
      psversion: formData.get("psversion") as string || undefined,
      ptversion: formData.get("ptversion") as string || undefined,
      harprelease: formData.get("harprelease") as string || undefined,
      pshome: formData.get("pshome") as string || undefined,
      volum: formData.get("volum") as string || undefined,
      descr: formData.get("descr") as string || undefined,
      anonym: formData.get("anonym") as string || undefined,
      edi: formData.get("edi") as string || undefined,
      typenvid: formData.get("typenvid") as string || undefined,
      statenvId: formData.get("statenvId") as string || undefined,
    };

    const validatedData = UpdateEnvSchema.parse({ env, ...rawData });
    const requestedTypenvId = validatedData.typenvid ? parseInt(validatedData.typenvid) : null;
    const statenvId = validatedData.statenvId ? parseInt(validatedData.statenvId) : null;

    const existingEnv = await db.envsharp.findUnique({
      where: { env },
    });

    if (!existingEnv) {
      return { success: false, error: "Environnement non trouvé" };
    }

    const familyChanges = isLockableFamilyId(requestedTypenvId)
      && existingEnv.typenvid !== requestedTypenvId;
    const kept = familyChanges
      ? false
      : await keepEnvFamily(env, validatedData, requestedTypenvId, statenvId, existingEnv);

    if (!kept && isLockableFamilyId(requestedTypenvId)) {
      const outcome = await withHarpDisplayLock(requestedTypenvId, (tx) =>
        writeLockedEnvUpdate(tx, env, validatedData, requestedTypenvId, statenvId),
      );
      if (!outcome.updated) {
        return { success: false, error: outcome.error };
      }
    }

    return { 
      success: true, 
      message: `L'environnement ${env} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    if (error instanceof HarpDisplayLockError) {
      return { success: false, error: error.message };
    }
    console.error("Erreur lors de la mise à jour de l'environnement:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'environnement" 
    };
  } finally {
    revalidatePath("/list/envs");
    revalidatePath(`/list/envs/${env}`);
  }
}
