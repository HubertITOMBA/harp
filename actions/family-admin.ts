"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  HarpDisplayLockError,
  withHarpDisplayLock,
  type HarpDisplayLockClient,
} from "@/lib/harp-display-lock";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const familyNameSchema = z.string().trim().min(1, "Le nom est requis").max(32, "Le nom dépasse 32 caractères");
const familyDescrSchema = z.string().trim().max(50, "La description dépasse 50 caractères").optional();

const FAMILY_LOCK_MIN = 1;
const FAMILY_LOCK_MAX = 32767;
const MAX_FAMILY_ID_ATTEMPTS = 3;

const CreateFamilySchema = z.object({
  typenv: familyNameSchema,
  descr: familyDescrSchema,
});

const UpdateFamilySchema = z.object({
  id: z.coerce.number().int().positive("Famille introuvable"),
  typenv: familyNameSchema,
  descr: familyDescrSchema,
});

export type FamilyAdminResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Crée une famille harptypenv, sans menu ni autorisation.
 * PORTAL_ADMIN est exigé. L'identifiant de 1 à 32767 est choisi par
 * l'application, puis le contrôle et l'insertion partagent son verrou.
 * createMenu et updateMenu prennent aussi ce verrou pour un display de niveau 3 compris entre 1 et 32767.
 *
 * @param formData - typenv et descr. Un typenvid envoyé par le formulaire est ignoré.
 * @returns Succès, ou un refus sans écriture de famille
 */
export async function createFamily(formData: FormData): Promise<FamilyAdminResult> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  const parsed = CreateFamilySchema.safeParse({
    typenv: formData.get("typenv"),
    descr: formData.get("descr") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };
  }

  const descr = parsed.data.descr && parsed.data.descr.length > 0 ? parsed.data.descr : null;
  const typenv = parsed.data.typenv;

  try {
    for (let attempt = 1; attempt <= MAX_FAMILY_ID_ATTEMPTS; attempt += 1) {
      const typenvid = await lowestFreeFamilyId();
      if (typenvid == null) {
        return { success: false, error: "Aucun identifiant de famille n'est disponible entre 1 et 32767." };
      }

      try {
        const outcome = await withHarpDisplayLock(typenvid, async (tx) => {
          const collision = await findFamilyCollision(tx, typenvid, typenv);
          if (collision) {
            return collision;
          }
          await tx.harptypenv.create({
            data: { typenvid, typenv, descr, href: null },
          });
          return { kind: "created" as const };
        });
        if (outcome.kind === "created") {
          revalidatePath("/list/families");
          return { success: true, message: `La famille ${typenv} a été créée` };
        }
        if (outcome.kind === "name") {
          return { success: false, error: outcome.message };
        }
        continue;
      } catch (error) {
        if (error instanceof HarpDisplayLockError) {
          return { success: false, error: error.message };
        }
        const uniqueField = uniqueFamilyField(error);
        if (uniqueField === "name") {
          return { success: false, error: `Le nom ${typenv} est déjà utilisé par une famille` };
        }
        if (uniqueField === "identifier") {
          continue;
        }
        throw error;
      }
    }
    return {
      success: false,
      error: "Les identifiants libres ont été pris par des créations simultanées. Réessayez.",
    };
  } catch (error) {
    console.error("Erreur lors de la création de la famille:", error);
    return { success: false, error: "Erreur lors de la création de la famille" };
  }
}

/**
 * Renomme une famille ou change sa description.
 * L'identifiant métier typenvid n'est pas écrit. Les liens restent sur id.
 *
 * @param formData - id technique, typenv et descr
 * @returns Succès, ou un refus sans autre modification
 */
export async function updateFamily(formData: FormData): Promise<FamilyAdminResult> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  const parsed = UpdateFamilySchema.safeParse({
    id: formData.get("id"),
    typenv: formData.get("typenv"),
    descr: formData.get("descr") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };
  }

  const descr = parsed.data.descr && parsed.data.descr.length > 0 ? parsed.data.descr : null;

  try {
    const current = await prisma.harptypenv.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, typenv: true },
    });
    if (!current) {
      return { success: false, error: "Famille introuvable" };
    }

    if (current.typenv !== parsed.data.typenv) {
      const sameName = await prisma.harptypenv.findFirst({
        where: { typenv: parsed.data.typenv, id: { not: current.id } },
        select: { id: true },
      });
      if (sameName) {
        return { success: false, error: `Le nom ${parsed.data.typenv} est déjà utilisé par une famille` };
      }
    }

    await prisma.harptypenv.update({
      where: { id: current.id },
      data: {
        typenv: parsed.data.typenv,
        descr,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Ce nom est déjà utilisé par une famille" };
    }
    console.error("Erreur lors de la modification de la famille:", error);
    return { success: false, error: "Erreur lors de la modification de la famille" };
  }

  revalidatePath("/list/families");
  return { success: true, message: `La famille ${parsed.data.typenv} a été modifiée` };
}

type FamilyDeleteOutcome =
  | { kind: "missing" }
  | { kind: "blocked"; environments: number; grants: number; menus: number }
  | { kind: "raced"; typenv: string }
  | { kind: "deleted"; typenv: string }
  | { kind: "changed" };

/**
 * Indique si cet identifiant peut être une clé de harpdisplaylock.
 *
 * @param typenvid - Identifiant lu avant la suppression
 * @returns true pour un entier de 1 à 32767
 */
function isLockableFamilyDisplay(typenvid: number | null): typenvid is number {
  return (
    typeof typenvid === "number" &&
    Number.isInteger(typenvid) &&
    typenvid >= FAMILY_LOCK_MIN &&
    typenvid <= FAMILY_LOCK_MAX
  );
}

/**
 * Supprime la famille sous le client transactionnel déjà ouvert.
 * Le SELECT verrouille la ligne, puis les trois contrôles et le DELETE
 * conditionnel utilisent ce même client. Une divergence de typenvid
 * n'exécute pas le DELETE.
 *
 * @param tx - Transaction du verrou, ou transaction de repli
 * @param id - Clé technique harptypenv.id
 * @param expectedTypenvId - Identifiant verrouillé, ou valeur lue hors plage
 * @returns missing, blocked, raced, deleted ou changed
 */
async function removeUnusedFamily(
  tx: HarpDisplayLockClient,
  id: number,
  expectedTypenvId: number | null,
): Promise<FamilyDeleteOutcome> {
  const locked = await tx.$queryRaw<Array<{ id: number; typenv: string; typenvid: number | null }>>`
    SELECT id, typenv, typenvid
    FROM harptypenv
    WHERE id = ${id}
    FOR UPDATE
  `;
  const family = locked[0];
  if (!family) {
    return { kind: "missing" };
  }
  if (family.typenvid !== expectedTypenvId) {
    return { kind: "changed" };
  }

  const typenvid = family.typenvid;
  const environments = typenvid == null
    ? 0
    : await tx.envsharp.count({ where: { typenvid } });
  const grants = typenvid == null
    ? 0
    : await tx.harpsubroletypenv.count({ where: { typenvid } });
  const menus = typenvid == null
    ? 0
    : await tx.harpmenus.count({ where: { level: 3, display: typenvid } });

  if (environments > 0 || grants > 0 || menus > 0) {
    return { kind: "blocked", environments, grants, menus };
  }

  const removed = await tx.$executeRaw`
    DELETE FROM harptypenv
    WHERE id = ${family.id}
      AND NOT EXISTS (
        SELECT 1 FROM envsharp e
        WHERE ${typenvid} IS NOT NULL AND e.typenvid = ${typenvid}
      )
      AND NOT EXISTS (
        SELECT 1 FROM harpsubroletypenv g
        WHERE ${typenvid} IS NOT NULL AND g.typenvid = ${typenvid}
      )
      AND NOT EXISTS (
        SELECT 1 FROM harpmenus m
        WHERE ${typenvid} IS NOT NULL AND m.level = 3 AND m.display = ${typenvid}
      )
  `;

  return { kind: removed === 1 ? "deleted" : "raced", typenv: family.typenv };
}

/**
 * Supprime une famille seulement si elle n'a aucune dépendance.
 * PORTAL_ADMIN est exigé. Un typenvid de 1 à 32767 est verrouillé avant
 * le SELECT FOR UPDATE. Un identifiant nul ou hors plage reste dans une
 * transaction, sans appel au verrou. La cascade RBAC ne peut pas
 * s'exécuter tant qu'un lien existe.
 *
 * @param id - Clé technique harptypenv.id
 * @returns Succès, ou la raison précise du refus
 */
export async function deleteFamily(id: number): Promise<FamilyAdminResult> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, error: admin.error };
  }

  const parsed = z.number().int().positive("Famille introuvable").safeParse(id);
  if (!parsed.success) {
    return { success: false, error: "Famille introuvable" };
  }

  try {
    const current = await prisma.harptypenv.findUnique({
      where: { id: parsed.data },
      select: { typenvid: true },
    });
    if (!current) {
      return { success: false, error: "Famille introuvable" };
    }

    const outcome = isLockableFamilyDisplay(current.typenvid)
      ? await withHarpDisplayLock(current.typenvid, (tx) =>
          removeUnusedFamily(tx, parsed.data, current.typenvid),
        )
      : await prisma.$transaction((tx) =>
          removeUnusedFamily(tx, parsed.data, current.typenvid),
        );

    if (outcome.kind === "missing") {
      return { success: false, error: "Famille introuvable" };
    }
    if (outcome.kind === "blocked") {
      return { success: false, error: blockedFamilyMessage(outcome) };
    }
    if (outcome.kind === "raced") {
      return {
        success: false,
        error: "La famille a reçu une dépendance pendant le contrôle. Rien n'a été supprimé.",
      };
    }
    if (outcome.kind === "changed") {
      return {
        success: false,
        error: "L'identifiant de la famille a changé pendant le contrôle. Rien n'a été supprimé.",
      };
    }
  } catch (error) {
    if (error instanceof HarpDisplayLockError) {
      return { success: false, error: error.message };
    }
    console.error("Erreur lors de la suppression de la famille:", error);
    return { success: false, error: "La famille n'a pas été supprimée" };
  }

  revalidatePath("/list/families");
  return { success: true, message: "La famille a été supprimée" };
}

type FamilyCollision =
  | { kind: "name"; message: string }
  | { kind: "identifier"; message: string };

/**
 * Choisit le plus petit identifiant absent des familles, des menus de niveau 3 et de psadm_typenv.
 * Les lignes de harpdisplaylock ne comptent pas : elles ne portent aucune famille.
 *
 * @returns Identifiant de 1 à 32767, ou null si la plage est pleine
 */
async function lowestFreeFamilyId(): Promise<number | null> {
  const [families, menus, legacy] = await Promise.all([
    prisma.harptypenv.findMany({
      where: { typenvid: { gte: FAMILY_LOCK_MIN, lte: FAMILY_LOCK_MAX } },
      select: { typenvid: true },
    }),
    prisma.harpmenus.findMany({
      where: { level: 3, display: { gte: FAMILY_LOCK_MIN, lte: FAMILY_LOCK_MAX } },
      select: { display: true },
    }),
    prisma.psadm_typenv.findMany({
      where: { display: { gte: FAMILY_LOCK_MIN, lte: FAMILY_LOCK_MAX } },
      select: { display: true },
    }),
  ]);

  const used = new Set<number>();
  for (const family of families) {
    if (family.typenvid != null) {
      used.add(family.typenvid);
    }
  }
  for (const menu of menus) {
    used.add(menu.display);
  }
  for (const row of legacy) {
    used.add(row.display);
  }
  for (let typenvid = FAMILY_LOCK_MIN; typenvid <= FAMILY_LOCK_MAX; typenvid += 1) {
    if (!used.has(typenvid)) {
      return typenvid;
    }
  }
  return null;
}

/**
 * Signale un identifiant, un nom ou une correspondance déjà occupée.
 * Les lectures passent par le client de la transaction qui tient le verrou.
 * Un nom déjà pris est distingué d'un identifiant devenu occupé.
 *
 * @param db - Client de la transaction harp-display
 * @param typenvid - Identifiant proposé
 * @param typenv - Nom proposé
 * @returns Collision classée, ou null si la création peut continuer
 */
async function findFamilyCollision(
  db: HarpDisplayLockClient,
  typenvid: number,
  typenv: string,
): Promise<FamilyCollision | null> {
  const [sameId, sameName, menus, legacy] = await Promise.all([
    db.harptypenv.findFirst({ where: { typenvid }, select: { typenv: true } }),
    db.harptypenv.findFirst({ where: { typenv }, select: { typenvid: true } }),
    db.harpmenus.findMany({
      where: { level: 3, display: typenvid },
      select: { menu: true },
    }),
    db.psadm_typenv.findMany({
      where: { display: typenvid },
      select: { typenv: true },
    }),
  ]);

  if (sameName) {
    return { kind: "name", message: `Le nom ${typenv} est déjà utilisé par une famille` };
  }

  const reasons: string[] = [];
  if (sameId) {
    reasons.push(`L'identifiant ${typenvid} est déjà utilisé par la famille ${sameId.typenv}`);
  }
  if (menus.length > 0) {
    reasons.push(
      `Un menu de niveau 3 utilise déjà le display ${typenvid} : ${menus.map((menu) => menu.menu).join(", ")}`
    );
  }
  if (legacy.length > 0) {
    reasons.push(
      `psadm_typenv.display ${typenvid} existe déjà : ${legacy.map((row) => row.typenv).join(", ")}`
    );
  }
  return reasons.length > 0 ? { kind: "identifier", message: reasons.join(". ") } : null;
}

/**
 * Lit la cible d'une violation d'unicité Prisma sur harptypenv.
 * typenvid est examiné avant typenv, car le second est un préfixe du premier.
 *
 * @param error - Erreur levée pendant l'insertion
 * @returns Champ en conflit, ou null si la cause est une autre erreur
 */
function uniqueFamilyField(error: unknown): "name" | "identifier" | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const target = error.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : typeof target === "string" ? target : "";
  if (text.includes("typenvid")) {
    return "identifier";
  }
  if (text.includes("typenv")) {
    return "name";
  }
  return null;
}

/**
 * Décrit les dépendances qui interdisent la suppression.
 *
 * @param counts - Comptes relus sous verrou
 * @returns Message sans indiquer qu'une ligne a été retirée
 */
function blockedFamilyMessage(counts: {
  environments: number;
  grants: number;
  menus: number;
}): string {
  const parts: string[] = [];
  if (counts.environments > 0) {
    parts.push(`${counts.environments} environnement${counts.environments > 1 ? "s" : ""}`);
  }
  if (counts.grants > 0) {
    parts.push(`${counts.grants} lien${counts.grants > 1 ? "s" : ""} RBAC`);
  }
  if (counts.menus > 0) {
    parts.push(`${counts.menus} menu${counts.menus > 1 ? "s" : ""} de niveau 3`);
  }
  return `Suppression refusée : ${parts.join(", ")}. Aucun environnement, menu ou droit n'a été modifié.`;
}
