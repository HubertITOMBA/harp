"use server";

import prisma from "@/lib/prisma";

/**
 * Migration pour :
 * 1. Remplacer TMA_LOCAL par USER dans tous les utilisateurs
 * 2. Remplacer TMA_LOCAL par USER dans tous les harproles
 * 3. Supprimer toutes les relations harpuseroles où le rôle est TMA_LOCAL
 */
export async function migrateTmaLocalToUser() {
  try {
    console.log("🚀 Début de la migration TMA_LOCAL -> USER");

    // 1. Récupérer tous les harproles avec role = 'TMA_LOCAL'
    const tmaLocalRoles = await prisma.harproles.findMany({
      where: {
        role: "TMA_LOCAL"
      },
      select: {
        id: true,
        role: true
      }
    });

    console.log(`📊 Trouvé ${tmaLocalRoles.length} harproles avec role TMA_LOCAL`);

    let deletedRelationsCount = 0;

    // 2. Supprimer toutes les relations harpuseroles qui pointent vers ces rôles TMA_LOCAL
    if (tmaLocalRoles.length > 0) {
      const roleIds = tmaLocalRoles.map(r => r.id);
      const deletedRelations = await prisma.harpuseroles.deleteMany({
        where: {
          roleId: {
            in: roleIds
          }
        }
      });
      deletedRelationsCount = deletedRelations.count;
      console.log(`🗑️  Supprimé ${deletedRelationsCount} relations harpuseroles avec TMA_LOCAL`);
    }

    // 3. Mettre à jour tous les harproles avec role = 'TMA_LOCAL' vers 'USER'
    const updatedHarproles = await prisma.harproles.updateMany({
      where: {
        role: "TMA_LOCAL"
      },
      data: {
        role: "USER"
      }
    });
    console.log(`✅ Mis à jour ${updatedHarproles.count} harproles de TMA_LOCAL vers USER`);

    // 4. Mettre à jour tous les utilisateurs avec role = 'TMA_LOCAL' vers 'USER'
    const updatedUsers = await prisma.user.updateMany({
      where: {
        role: "TMA_LOCAL"
      },
      data: {
        role: "USER"
      }
    });
    console.log(`✅ Mis à jour ${updatedUsers.count} utilisateurs de TMA_LOCAL vers USER`);

    // 5. Vérifier s'il reste des harproles avec role = 'TMA_LOCAL'
    const remainingHarproles = await prisma.harproles.count({
      where: {
        role: "TMA_LOCAL"
      }
    });

    // 6. Vérifier s'il reste des utilisateurs avec role = 'TMA_LOCAL'
    const remainingUsers = await prisma.user.count({
      where: {
        role: "TMA_LOCAL"
      }
    });

    if (remainingHarproles > 0 || remainingUsers > 0) {
      console.warn(`⚠️  Attention: ${remainingHarproles} harproles et ${remainingUsers} utilisateurs avec TMA_LOCAL restants`);
      return {
        success: false,
        message: `Migration partielle: ${remainingHarproles} harproles et ${remainingUsers} utilisateurs avec TMA_LOCAL restants`,
        deletedRelations: deletedRelationsCount,
        updatedHarproles: updatedHarproles.count,
        updatedUsers: updatedUsers.count,
        remainingHarproles,
        remainingUsers
      };
    }

    console.log("✅ Migration terminée avec succès !");
    return {
      success: true,
      message: "Migration terminée avec succès",
      deletedRelations: deletedRelationsCount,
      updatedHarproles: updatedHarproles.count,
      updatedUsers: updatedUsers.count
    };

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    return {
      success: false,
      message: `Erreur lors de la migration: ${error instanceof Error ? error.message : String(error)}`,
      deletedRelations: 0,
      updatedHarproles: 0,
      updatedUsers: 0
    };
  }
}

