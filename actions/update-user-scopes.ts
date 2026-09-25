"use server";

import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import {
  ASSIGNABLE_USER_SCOPE_CODES,
  normalizeRequestedScopeCodes,
  prepareUserScopeUpdate,
} from "@/lib/user-scopes";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateUserScopesSchema = z.object({
  netid: z.string().min(1, "NetID requis").max(32, "NetID trop long"),
});

/**
 * Remplace les périmètres 4K et 150K d'un utilisateur.
 *
 * Réservé à une session PORTAL_ADMIN, rôles lus en base.
 * La cible PORTAL_ADMIN est refusée. UNASSIGNED et tout autre code sont refusés.
 * Seule la table harpuserscope de l'utilisateur cible est modifiée.
 * Une sélection vide retire 4K et 150K.
 *
 * @param netid - NetID de l'utilisateur cible
 * @param requestedCodes - Codes demandés, parmi 4K et 150K
 * @returns success et message, ou error sans écriture
 */
export async function updateUserScopes(netid: string, requestedCodes: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Vous devez être connecté pour modifier les périmètres",
      };
    }

    const validated = UpdateUserScopesSchema.safeParse({ netid });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Données invalides",
      };
    }

    const normalized = normalizeRequestedScopeCodes(requestedCodes);
    if (!normalized.ok) {
      return { success: false, error: normalized.error };
    }

    const operatorRoles = await getAllUserRoles();

    const target = await prisma.user.findUnique({
      where: { netid: validated.data.netid },
      select: {
        id: true,
        role: true,
        harpuseroles: {
          select: {
            harproles: {
              select: { role: true },
            },
          },
        },
      },
    });

    if (!target) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const targetRoles = [
      target.role ? String(target.role) : "",
      ...target.harpuseroles.map((row) => row.harproles.role),
    ].filter((role) => role.length > 0);

    const catalog = await prisma.harpscope.findMany({
      where: { code: { in: [...ASSIGNABLE_USER_SCOPE_CODES] } },
      select: { id: true, code: true },
    });

    const decision = prepareUserScopeUpdate({
      operatorRoles,
      targetRoles,
      requestedCodes: normalized.codes,
      catalog,
    });

    if (!decision.ok) {
      return { success: false, error: decision.error };
    }

    await prisma.$transaction(async (tx) => {
      await tx.harpuserscope.deleteMany({
        where: { userId: target.id },
      });
      if (decision.scopeIds.length > 0) {
        await tx.harpuserscope.createMany({
          data: decision.scopeIds.map((scopeId) => ({
            userId: target.id,
            scopeId,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath("/list/users");
    revalidatePath(`/list/users/${validated.data.netid}`);

    return {
      success: true,
      message: "Périmètres d'environnements mis à jour",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des périmètres:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour des périmètres",
    };
  }
}
