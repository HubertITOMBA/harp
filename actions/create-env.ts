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

const CreateEnvSchema = z.object({
  env: z.string().min(1, "Le nom de l'environnement est requis").max(32),
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

type EnvInput = z.infer<typeof CreateEnvSchema>;

type EnvWriteResult =
  | { created: true }
  | { created: false; error: string };

/**
 * Indique si la valeur qui va être écrite est un identifiant de famille verrouillable.
 * null, NaN et les entiers hors 1–32767 restent sur le chemin sans verrou.
 *
 * @param typenvid - Valeur produite par parseInt, ou null
 * @returns true seulement pour un entier de 1 à 32767
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
 * Vérifie le nom puis insère l'environnement.
 *
 * @param client - Client courant, ou transaction qui tient le verrou
 * @param data - Champs validés
 * @param typenvid - Valeur réellement écrite, y compris null ou NaN
 * @param statenvId - Statut écrit, ou 4 par défaut
 * @returns Création, ou le refus de nom déjà utilisé
 */
async function writeEnv(
  client: HarpDisplayLockClient | typeof db,
  data: EnvInput,
  typenvid: number | null,
  statenvId: number,
): Promise<EnvWriteResult> {
  const existingEnv = await client.envsharp.findUnique({
    where: { env: data.env },
  });

  if (existingEnv) {
    return { created: false, error: "Un environnement avec ce nom existe déjà" };
  }

  await client.envsharp.create({
    data: {
      env: data.env,
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
      typenvid: typenvid,
      statenvId: statenvId,
    },
  });

  return { created: true };
}

/**
 * Crée un environnement envsharp.
 * PORTAL_ADMIN est exigé. Si le typenvid écrit est un entier de 1 à 32767,
 * ce verrou est pris avant le contrôle de nom et l'insertion.
 * Une valeur absente reste null et ne prend pas le verrou.
 *
 * @param formData - Champs du formulaire de création
 * @returns Succès avec message, ou un refus
 */
export async function createEnv(formData: FormData) {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  try {
    const rawData = {
      env: formData.get("env") as string,
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

    const validatedData = CreateEnvSchema.parse(rawData);
    const typenvid = validatedData.typenvid ? parseInt(validatedData.typenvid) : null;
    const statenvId = validatedData.statenvId ? parseInt(validatedData.statenvId) : 4;
    const outcome = isLockableFamilyId(typenvid)
      ? await withHarpDisplayLock(typenvid, (tx) =>
          writeEnv(tx, validatedData, typenvid, statenvId),
        )
      : await writeEnv(db, validatedData, typenvid, statenvId);

    if (!outcome.created) {
      return { success: false, error: outcome.error };
    }

    return { 
      success: true, 
      message: `L'environnement ${validatedData.env} a été créé avec succès` 
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
    console.error("Erreur lors de la création de l'environnement:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'environnement" 
    };
  } finally {
    revalidatePath("/list/envs");
  }
}
