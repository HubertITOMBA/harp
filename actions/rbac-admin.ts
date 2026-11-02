"use server";

import prisma from "@/lib/prisma";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  loadFamilyAccess,
  loadMenuFamilyCoherence,
  loadRoleSubroles,
  type FamilyAccessView,
  type MenuCoherenceView,
  type RoleSubrolesView,
} from "@/lib/rbac-admin-read";

const roleIdSchema = z.number().int().positive("Le rôle est requis");
const subroleIdSchema = z.number().int().positive("Le sous-rôle est requis");
const typenvidSchema = z.number().int().positive("L'identifiant de famille est invalide");
const codeSchema = z.string().trim().min(1, "Le code est requis").max(32, "Le code dépasse 32 caractères");
const descrSchema = z.string().trim().max(100, "La description dépasse 100 caractères").optional();

type AdminResult = {
  success: boolean;
  error?: string;
  message?: string;
  sharedRoles?: string[];
};

/**
 * Refuse la mutation si la session n'est pas PORTAL_ADMIN.
 *
 * @returns Le message de refus, ou null
 */
async function denyUnlessAdmin(): Promise<string | null> {
  const admin = await requirePortalAdmin();
  return admin.ok ? null : admin.error;
}

function invalid(error: z.ZodError): AdminResult {
  return { success: false, error: error.errors[0]?.message ?? "Données invalides" };
}

/**
 * Recharge les écrans d'administration qui lisent les sous-rôles.
 */
function revalidateAdminSurfaces(): void {
  revalidatePath("/list/roles");
  revalidatePath("/list/envs");
  revalidatePath("/list/menus");
}

/**
 * Lecture administrateur des sous-rôles d'un rôle.
 *
 * @param roleId - Identifiant harproles
 * @returns La vue, ou une erreur sans donnée
 */
export async function readRoleSubroles(roleId: number): Promise<
  { success: true; data: RoleSubrolesView } | { success: false; error: string }
> {
  const result = await loadRoleSubroles(roleId);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}

/**
 * Lecture administrateur des accès d'une famille.
 *
 * @param typenvid - Famille de l'environnement, ou null
 * @returns La vue, null si l'environnement n'a pas de famille, ou une erreur
 */
export async function readFamilyAccess(typenvid: number | null): Promise<
  { success: true; data: FamilyAccessView | null } | { success: false; error: string }
> {
  const result = await loadFamilyAccess(typenvid);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}

/**
 * Lecture de cohérence entre un menu et la famille de même display.
 *
 * @param menuId - Identifiant harpmenus
 * @returns La vue informative, ou une erreur
 */
export async function readMenuFamilyCoherence(menuId: number): Promise<
  { success: true; data: MenuCoherenceView } | { success: false; error: string }
> {
  const result = await loadMenuFamilyCoherence(menuId);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}

/**
 * Noms des rôles qui portent déjà ce sous-rôle.
 *
 * @param subroleId - Identifiant harpsubrole
 * @returns Libellés harproles.role
 */
async function sharedRoleNames(subroleId: number): Promise<string[]> {
  const links = await prisma.harprolesubrole.findMany({
    where: { subroleId },
    select: { harproles: { select: { role: true } } },
  });
  return links.map((link) => link.harproles.role).sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Associe un sous-rôle existant à un rôle.
 * Écrit uniquement harprolesubrole.
 *
 * @param roleId - Identifiant harproles
 * @param subroleId - Identifiant harpsubrole
 * @returns Succès, ou une erreur sans écriture
 */
export async function attachSubroleToRole(roleId: number, subroleId: number): Promise<AdminResult> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { success: false, error: denied };
  }
  const parsed = z.object({ roleId: roleIdSchema, subroleId: subroleIdSchema }).safeParse({ roleId, subroleId });
  if (!parsed.success) {
    return invalid(parsed.error);
  }

  const role = await prisma.harproles.findUnique({ where: { id: parsed.data.roleId }, select: { id: true } });
  if (!role) {
    return { success: false, error: "Rôle introuvable" };
  }
  const subrole = await prisma.harpsubrole.findUnique({ where: { id: parsed.data.subroleId }, select: { id: true } });
  if (!subrole) {
    return { success: false, error: "Sous-rôle introuvable" };
  }
  const existing = await prisma.harprolesubrole.findUnique({
    where: { roleId_subroleId: { roleId: parsed.data.roleId, subroleId: parsed.data.subroleId } },
    select: { roleId: true },
  });
  if (existing) {
    return { success: false, error: "Ce sous-rôle est déjà associé à ce rôle" };
  }

  await prisma.harprolesubrole.create({
    data: { roleId: parsed.data.roleId, subroleId: parsed.data.subroleId },
  });
  revalidateAdminSurfaces();
  return { success: true, message: "Sous-rôle associé au rôle" };
}

/**
 * Crée un sous-rôle puis l'associe au rôle.
 * N'écrit pas de famille TypeEnv.
 *
 * @param roleId - Identifiant harproles
 * @param code - Code unique du sous-rôle
 * @param descr - Description facultative
 * @returns Succès, ou une erreur sans association
 */
export async function createSubroleAndAttach(
  roleId: number,
  code: string,
  descr?: string
): Promise<AdminResult> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { success: false, error: denied };
  }
  const parsed = z.object({
    roleId: roleIdSchema,
    code: codeSchema,
    descr: descrSchema,
  }).safeParse({ roleId, code, descr });
  if (!parsed.success) {
    return invalid(parsed.error);
  }

  const role = await prisma.harproles.findUnique({ where: { id: parsed.data.roleId }, select: { id: true } });
  if (!role) {
    return { success: false, error: "Rôle introuvable" };
  }
  const duplicate = await prisma.harpsubrole.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (duplicate) {
    return { success: false, error: "Ce code de sous-rôle existe déjà" };
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.harpsubrole.create({
      data: {
        code: parsed.data.code,
        descr: parsed.data.descr && parsed.data.descr.length > 0 ? parsed.data.descr : null,
        active: true,
      },
      select: { id: true },
    });
    await tx.harprolesubrole.create({
      data: { roleId: parsed.data.roleId, subroleId: created.id },
    });
  });
  revalidateAdminSurfaces();
  return { success: true, message: "Sous-rôle créé et associé au rôle" };
}

/**
 * Retire uniquement l'association rôle / sous-rôle.
 *
 * @param roleId - Identifiant harproles
 * @param subroleId - Identifiant harpsubrole
 * @returns Succès si la ligne harprolesubrole a été supprimée
 */
export async function detachSubroleFromRole(roleId: number, subroleId: number): Promise<AdminResult> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { success: false, error: denied };
  }
  const parsed = z.object({ roleId: roleIdSchema, subroleId: subroleIdSchema }).safeParse({ roleId, subroleId });
  if (!parsed.success) {
    return invalid(parsed.error);
  }

  const deleted = await prisma.harprolesubrole.deleteMany({
    where: { roleId: parsed.data.roleId, subroleId: parsed.data.subroleId },
  });
  if (deleted.count === 0) {
    return { success: false, error: "Cette association n'existe pas" };
  }
  revalidateAdminSurfaces();
  return { success: true, message: "Association rôle / sous-rôle retirée" };
}

/**
 * Accorde une famille à un sous-rôle déjà porté par le rôle, ou après création du sous-rôle.
 * En création, harpsubrole, harprolesubrole et harpsubroletypenv sont écrits dans une seule transaction.
 * Un sous-rôle existant ne reçoit que harpsubroletypenv.
 *
 * @param input.roleId - Rôle choisi par l'administrateur
 * @param input.typenvid - Famille affichée
 * @param input.subroleId - Sous-rôle déjà associé à ce rôle
 * @param input.newSubrole - Création, association et grant, à l'exclusion de subroleId
 * @returns Succès et les rôles touchés si le sous-rôle est partagé
 */
export async function grantFamilyThroughSubrole(input: {
  roleId: number;
  typenvid: number;
  subroleId?: number;
  newSubrole?: { code: string; descr?: string };
}): Promise<AdminResult> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { success: false, error: denied };
  }
  const parsed = z.object({
    roleId: roleIdSchema,
    typenvid: typenvidSchema,
    subroleId: subroleIdSchema.optional(),
    newSubrole: z.object({ code: codeSchema, descr: descrSchema }).optional(),
  }).refine((value) => (value.subroleId != null) !== (value.newSubrole != null), {
    message: "Choisir un sous-rôle existant ou en créer un",
  }).safeParse(input);
  if (!parsed.success) {
    return invalid(parsed.error);
  }

  const role = await prisma.harproles.findUnique({ where: { id: parsed.data.roleId }, select: { id: true } });
  if (!role) {
    return { success: false, error: "Rôle introuvable" };
  }
  const family = await prisma.harptypenv.findUnique({
    where: { typenvid: parsed.data.typenvid },
    select: { typenvid: true },
  });
  if (!family || family.typenvid == null) {
    return { success: false, error: "Famille introuvable" };
  }

  let subroleId = parsed.data.subroleId ?? null;
  if (parsed.data.newSubrole) {
    const duplicate = await prisma.harpsubrole.findUnique({
      where: { code: parsed.data.newSubrole.code },
      select: { id: true },
    });
    if (duplicate) {
      return { success: false, error: "Ce code de sous-rôle existe déjà" };
    }
    const created = await prisma.$transaction(async (tx) => {
      const subrole = await tx.harpsubrole.create({
        data: {
          code: parsed.data.newSubrole!.code,
          descr: parsed.data.newSubrole!.descr && parsed.data.newSubrole!.descr.length > 0
            ? parsed.data.newSubrole!.descr
            : null,
          active: true,
        },
        select: { id: true },
      });
      await tx.harprolesubrole.create({
        data: { roleId: parsed.data.roleId, subroleId: subrole.id },
      });
      await tx.harpsubroletypenv.create({
        data: { subroleId: subrole.id, typenvid: parsed.data.typenvid },
      });
      return subrole;
    });
    subroleId = created.id;
  } else if (subroleId != null) {
    const linked = await prisma.harprolesubrole.findUnique({
      where: { roleId_subroleId: { roleId: parsed.data.roleId, subroleId } },
      select: { roleId: true },
    });
    if (!linked) {
      return { success: false, error: "Ce sous-rôle n'est pas associé au rôle choisi" };
    }
    const already = await prisma.harpsubroletypenv.findUnique({
      where: { subroleId_typenvid: { subroleId, typenvid: parsed.data.typenvid } },
      select: { subroleId: true },
    });
    if (already) {
      return { success: false, error: "Cette famille est déjà accordée à ce sous-rôle" };
    }
    await prisma.harpsubroletypenv.create({
      data: { subroleId, typenvid: parsed.data.typenvid },
    });
  }

  if (subroleId == null) {
    return { success: false, error: "Sous-rôle introuvable" };
  }

  const sharedRoles = await sharedRoleNames(subroleId);
  revalidateAdminSurfaces();
  return {
    success: true,
    message: "Famille accordée via le sous-rôle",
    sharedRoles,
  };
}

/**
 * Retire une famille d'un sous-rôle.
 * Supprime uniquement harpsubroletypenv.
 *
 * @param subroleId - Identifiant harpsubrole
 * @param typenvid - Famille à retirer
 * @returns Succès, et les rôles qui perdent cet accès par ce sous-rôle
 */
export async function revokeFamilyFromSubrole(subroleId: number, typenvid: number): Promise<AdminResult> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { success: false, error: denied };
  }
  const parsed = z.object({
    subroleId: subroleIdSchema,
    typenvid: typenvidSchema,
  }).safeParse({ subroleId, typenvid });
  if (!parsed.success) {
    return invalid(parsed.error);
  }

  const family = await prisma.harptypenv.findUnique({
    where: { typenvid: parsed.data.typenvid },
    select: { typenvid: true },
  });
  if (!family || family.typenvid == null) {
    return { success: false, error: "Famille introuvable" };
  }
  const subrole = await prisma.harpsubrole.findUnique({
    where: { id: parsed.data.subroleId },
    select: { id: true },
  });
  if (!subrole) {
    return { success: false, error: "Sous-rôle introuvable" };
  }

  const sharedRoles = await sharedRoleNames(parsed.data.subroleId);
  const deleted = await prisma.harpsubroletypenv.deleteMany({
    where: { subroleId: parsed.data.subroleId, typenvid: parsed.data.typenvid },
  });
  if (deleted.count === 0) {
    return { success: false, error: "Cette famille n'est pas accordée à ce sous-rôle" };
  }
  revalidateAdminSurfaces();
  return {
    success: true,
    message: "Famille retirée du sous-rôle",
    sharedRoles,
  };
}
