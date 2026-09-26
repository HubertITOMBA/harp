/**
 * Logique mÃ©tier des imports GO LIVE.
 * Ce module n'est pas une Server Action : aucune session et aucun contrÃ´le d'accÃ¨s Web.
 * Les appels Web passent par actions/importharp.ts.
 */

import * as z from "zod";
import { toast } from "react-toastify";
import type { UserRole } from "@prisma/client";
import prisma  from "@/lib/prisma";
/**
 * Fonction utilitaire pour gÃ©rer les erreurs Prisma de maniÃ¨re cohÃ©rente
 *
 * @param error - L'erreur capturÃ©e
 * @param defaultMessage - Message d'erreur par dÃ©faut si l'erreur n'est pas reconnue
 * @param context - Contexte supplÃ©mentaire pour le logging (nom de la fonction, etc.)
 * @returns Un objet avec error et details pour Ãªtre retournÃ© par les Server Actions
 */
function handlePrismaError(
  error: unknown,
  defaultMessage: string,
  context?: string
): { error: string; details?: string } {
  console.error(
    context ? `${context}:` : "Erreur:",
    error
  );

  // Gestion spÃ©cifique des erreurs Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code?: string; message?: string; meta?: unknown };

    // Erreur de connexion Ã  la base de donnÃ©es
    if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
      return {
        error: "Impossible de se connecter Ã  la base de donnÃ©es. Veuillez vÃ©rifier que le serveur de base de donnÃ©es est accessible.",
        details: prismaError.message || "Erreur de connexion"
      };
    }

    // Autres erreurs Prisma
    return {
      error: `${defaultMessage} (Erreur Prisma ${prismaError.code})`,
      details: prismaError.message || "Erreur de base de donnÃ©es"
    };
  }

  // Gestion des erreurs gÃ©nÃ©riques
  return {
    error: defaultMessage,
    details: error instanceof Error ? error.message : String(error) || "Erreur inconnue"
  };
}

export const insertTypeBases = async () => {
   try {
     const catalog = [
       { type_base: '2K', descr: 'Base 2K', icone: '' },
       { type_base: '4K', descr: 'Base 4K', icone: '' },
       { type_base: '150K', descr: 'Base 150K', icone: '' },
     ];

     const existing = await prisma.harptypebase.findMany({
       select: { type_base: true },
     });
     const present = new Set(existing.map((row) => row.type_base));
     const missing = catalog.filter((row) => !present.has(row.type_base));

     if (missing.length === 0) {
       return { info: "Le seed harptypebase est dÃ©jÃ  complet. Aucune ligne manquante." };
     }

     if (existing.length === 0) {
       await prisma.$executeRaw`ALTER TABLE harptypebase AUTO_INCREMENT = 1`;
     }

     await prisma.harptypebase.createMany({
       data: missing,
       skipDuplicates: true,
     });

     return { success: `${missing.length} type(s) de base ajoutÃ©(s).` };
   } catch (error) {
     return handlePrismaError(error, "HARP Erreur lors de l'ajout de type de bases", "insertTypeBases");
   }
 };

 export const importerLesStatus = async () => {
  try {
    const catalog = [
      { statenv: 'ANONYMISE', descr: 'DonnÃ©es anonymisÃ©es', icone: 'anonym.png' },
      { statenv: 'BASE_ONLY', descr: 'AccÃ¨s uniquement Ã  la base de donnÃ©es', icone: 'base_only.png' },
      { statenv: 'DECOMMISSION', descr: 'Environnement Ã  DÃ©commissionner', icone: 'decommission.png' },
      { statenv: 'DUMMY', descr: 'Divers', icone: 'special.png' },
      { statenv: 'FERME', descr: 'Evironnement indisponible', icone: 'ferme.png' },
      { statenv: 'INVISIBLE', descr: 'Invisible', icone: 'invisible.png' },
      { statenv: 'OBSOLETE', descr: 'Environnement obsolÃ¨te', icone: 'obsolete.png' },
      { statenv: 'OUVERT',  descr: 'Environnement disponible', icone: 'ouvert.png' },
      { statenv: 'REFRESH', descr: 'Environnement en cours de rafraichissement', icone: 'refresh.png' },
      { statenv: 'RESTREINT', descr: 'AccÃ¨s reservÃ© Ã  certains utilisateurs', icone: 'restreint.png' }
    ];

    const existing = await prisma.statutenv.findMany({
      select: { statenv: true },
    });
    const present = new Set(existing.map((row) => row.statenv));
    const missing = catalog.filter((row) => !present.has(row.statenv));

    if (missing.length === 0) {
      return { info: "Le seed statutenv est dÃ©jÃ  complet. Aucune ligne manquante." };
    }

    if (existing.length === 0) {
      await prisma.$executeRaw`ALTER TABLE statutenv AUTO_INCREMENT = 1`;
    }

    await prisma.statutenv.createMany({
      data: missing,
      skipDuplicates: true,
    });

    return { success: `${missing.length} statut(s) d'environnement ajoutÃ©(s).` };
  } catch (error) {
    return handlePrismaError(error, "HARP Erreur lors de l'importation des statuts d'environnement", "importerLesStatus");
  }
};


 export const updateDispoEnvIds = async () => {
  try {

      // VÃ©rifier si la table est vide
      const countstatutenv = await prisma.statutenv.count();

      if (countstatutenv === 0) {
        return { info: "La table statutenv est vide. Veuillez d'abord importer les statuts." };
      }


    // RÃ©cupÃ©rer tous les statutenv
    const statutenvs = await prisma.statutenv.findMany();

    // RÃ©cupÃ©rer toutes les dispositions
    const dispositions = await prisma.psadm_dispo.findMany();

    // Traiter les mises Ã  jour par lots pour Ã©viter d'Ã©puiser le pool de connexions
    const BATCH_SIZE = 50; // Traiter 50 mises Ã  jour Ã  la fois
    let updatedCount = 0;

    for (let i = 0; i < dispositions.length; i += BATCH_SIZE) {
      const batch = dispositions.slice(i, i + BATCH_SIZE);

      // Mettre Ã  jour chaque disposition dans le lot (sÃ©quentiellement pour Ã©viter les conflits de concurrence)
      for (const dispo of batch) {
        const matchingStatutenv = statutenvs.find(
          statut => statut.statenv === dispo.statenv
        );

        if (matchingStatutenv) {
          await prisma.psadm_dispo.update({
            where: {
              env_fromdate: {
                env: dispo.env,
                fromdate: dispo.fromdate
              }
            },
            data: {
              statenvId: matchingStatutenv.id
            }
          });
          updatedCount++;
        }
      }

      // Petit dÃ©lai entre les lots pour laisser le pool de connexions se rÃ©cupÃ©rer
      if (i + BATCH_SIZE < dispositions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: `La mise Ã  jour de statut d'environnements terminÃ©e avec succÃ¨s ! ${updatedCount} disposition(s) mise(s) Ã  jour.` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour du statut des environnements", "updateDispoEnvIds");
  }
};



 export const initDefaultValues = async () => {
  try {
      // Mise Ã  jour de tous les environnements dans les nouvelles tables HARP
      await prisma.envsharp.updateMany({ data: { statenvId: 8 } });

      await prisma.$executeRaw`UPDATE psadm_user set lastlogin = now() where lastlogin = 0`;
      await prisma.$executeRaw`UPDATE psadm_dispo set fromdate = now() where fromdate = 0`;
      await prisma.$executeRaw`UPDATE psadm_env set datmaj = now() where datmaj is null`;

      // const countUser = await prisma.psadm_user.count({
      //   where: { lastlogin: null }
      // });
      // if (countUser > 0) {
      //   await prisma.psadm_user.updateMany({
      //     where: { lastlogin: null },
      //     data: { lastlogin: new Date() }
      //   });
      //   return { info: "Les dates (lastlogin) nulle sur psadm_user : " , countUser};
      // } else {
      //   return { info: "Pas de date (lastlogin) nulle  sur psadm_user", countUser };
      // };

      // const countDispo = await prisma.psadm_dispo.count({
      //   where: { fromdate: null }
      // });
      // if (countDispo > 0) {
      //   await prisma.psadm_dispo.updateMany({
      //     where: { fromdate: null },
      //     data: { fromdate: new Date() }
      //   });
      // }return { info: "Les dates (lastlogin) nulle sur psadm_user : " , countDispo};
      // } else {
      //   return { info: "Pas de date (lastlogin) nulle  sur psadm_user", countDispo };
      // };


      return { success: "Mises Ã  jour es valeur par defaut effectuÃ©es avec succÃ¨s !" };
  } catch (error) {
      return handlePrismaError(error, "Erreur lors des mises Ã  jour des valeur par defaut !", "initDefaultValues");
  }
};


export const GenererLesMenus = async () => {
  try {
    const catalog = [
        { display: 7, level: 3, menu: 'DEVELOPPEMENT HOTFIX', href: '', descr: '', icone: 'pocket-knife.png', active: 1, role: 'TMA_LOCAL' },
        { display: 6, level: 3, menu: 'DEVELOPPEMENT PROJET', href: '', descr: '', icone: 'brain-cog.png', active: 1, role: 'TMA_LOCAL' },
        { display: 2, level: 3, menu: 'DEVOPS 1', href: '', descr: 'Environnements DEVOPS 1', icone: 'workflow.png', active: 1, role: 'TMA_LOCAL' },
        { display: 3, level: 3, menu:  'DEVOPS 2', href: '', descr: 'Environnements DEVOPS 2', icone: 'share-2.png', active: 1, role: 'TMA_LOCAL'},
        { display: 4, level: 3, menu:  'DEVOPS FUSION', href: '', descr: 'Environnements DEVOPS Fusion', icone: 'git-merge.png', active: 1, role: 'TMA_LOCAL'},
        { display: 5, level: 3, menu:  'DEVOPS PACKAGING', href: '', descr: 'Environnements DEVOPS Packaging', icone: 'git-merge.png', active: 1, role: 'TMA_LOCAL'},
        { display: 19, level: 3, menu:  'POC92', href: '', descr: 'Environnements POC 9.2', icone: 'wallet-cards.png', active: 1, role: 'TMA_LOCAL'},
        { display: 11, level: 3, menu:  'PRE-PRODUCTION', href: '', descr: '', icone: 'ferris-wheel.png', active: 1, role: 'PSADMIN'},
        { display: 12, level: 3, menu:  'PRODUCTION', href: '', descr: 'Environnements de production HARP', icone: 'server-cog.png', active: 1, role: 'TMA_LOCAL'},
        { display: 16, level: 3, menu:  'PSADMIN', href: '', descr: '', icone: 'speech.png', active: 1, role: 'TMA_LOCAL'},
        { display: 21, level: 3, menu:  'PUM-MAINTENANCE PS', href: '', descr: 'Maintenance Peoplesoft', icone: 'puzzle.png', active: 1, role: 'TMA_LOCAL'},
        { display: 9,  level: 3, menu:  'QUALIFICATION', href: '', descr: 'Environnements de qualification HARP', icone: 'shieldcheck.png', active: 1, role: 'TMA_LOCAL'},
        { display: 10, level: 3, menu:  'RECETTE', href: '', descr: 'Environnements de recette HARP', icone: 'concierge-bell.png', active: 1, role: 'TMA_LOCAL'},
        { display: 15, level: 3, menu:  'REFERENCE LIVRAISON', href: '', descr: '', icone: 'truck.png', active: 1, role: 'TMA_LOCAL'},
        { display: 13, level: 3, menu:  'SECOURS - DRP', href: '', descr: 'Environnements de secours DRP', icone: 'server-off.png', active: 1, role: 'TMA_LOCAL'},
        { display: 8, level: 3, menu:  'TMA', href: '', descr: 'Environnements DEVOPS', icone: 'dessert.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 1, menu:  'Accueil', href: '/home', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 11, level: 1, menu:  'Administration', href: '/admin', descr: '', icone: '', active: 1, role: 'PSADMIN'},
        { display: 9, level: 1, menu:  'Base connaissances', href: 'http://portails.adsaft.ft.net:9070', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Environnements', href: '/list/envs', descr: '', icone: 'database.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'instances Oracle', href: '/list/instora', descr: '', icone: 'modeling.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Journal', href: '/list/journal', descr: '', icone: 'newspaper.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Liens', href: '/list/links', descr: '', icone: 'menu.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Messages Portail', href: '/list/messages', descr: '', icone: 'message.png', active: 1, role: 'TMA_LOCAL'},
        { display: 10, level: 1, menu:  'Octane', href: 'https://octane.rd.francetelecom.fr', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Onglets Navigation', href: '/list/menus', descr: '', icone: 'menu.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Outils', href: '/list/tools', descr: '', icone: 'tools.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Parametrage Portail', href: '/list/harparam', descr: '', icone: 'ferris-wheel.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Permissions', href: '/list/permis', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Permissions par RÃ´le', href: '/list/permrole', descr: '', icone: 'localact.png',active:  1, role: 'TMA_LOCAL'},
        { display: 5, level: 1, menu:  'Recherche', href: '/recherche', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 7, level: 1, menu:  'Refresh Infos', href: '/refresh-info', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 7, level: 1, menu:  'Applications', href: '/statuts-applications', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'RÃ´les', href: '/list/roles', descr: '', icone: '',active:  1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'RÃ´les serveurs', href: '/list/servrole', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'RÃ´les Utilisateurs', href: '/list/useroles', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 3, level: 1, menu:  'Self-service', href: '/self-service', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Serveurs', href: '/list/servers', descr: '', icone: 'server.png', active: 1, role: 'TMA_LOCAL'},
        { display: 8, level: 1, menu:  'Statacm', href: 'http://statacm.adsaft.ft.net:8080', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Historique', href: '/list/histoenv', descr: '', icone: 'shieldcheck.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Types d\'application', href: '/list/appli', descr: '', icone: 'puzzle.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Types d\'environnement', href: '/list/menuenv', descr: '', icone: 'menuenv.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Types de serveur', href: '/list/tpserv', descr: '', icone: 'server-cog.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Types de statut', href: '/list/tpstatus', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Utilisateurs', href: '/list/users', descr: '', icone: 'users.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Versions Harp', href: '/list/harpvers', descr: '', icone: 'socialead.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Versions PeopleTools', href: '/list/ptvers', descr: '', icone: 'autov.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Volumetrie', href: '/list/volums', descr: '', icone: 'deployed.png', active: 1, role: 'TMA_LOCAL'},
    ];

    const existing = await prisma.harpmenus.findMany({
      select: { menu: true },
    });
    const present = new Set(existing.map((row) => row.menu));
    const missing = catalog.filter((row) => !present.has(row.menu));

    if (missing.length === 0) {
      return { info: "Le seed harpmenus est dÃ©jÃ  complet. Aucune ligne manquante." };
    }

    if (existing.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpmenus AUTO_INCREMENT = 1`;
    }

    await prisma.harpmenus.createMany({
      data: missing.map((row) => ({
        ...row,
        role: row.role as UserRole,
      })),
      skipDuplicates: true,
    });

    return { success: `${missing.length} menu(s) ajoutÃ©(s).` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la gÃ©nÃ©ration des menus !", "GenererLesMenus");
  }
};


export const lierTypeEnvs = async () => {
  try {
    const updates = [
      { typenv: "PSADMIN" },
      { typenv: "TMA" },
      { typenv: "DEVOPS 1" },
      { typenv: "DEVOPS 2" },
      { typenv: "PUM-MAINTENANCE PS" },
      { typenv: "SECOURS - DRP" },
      { typenv: "DEVELOPPEMENT PROJET" },
      { typenv: "DEVOPS FUSION" },
      { typenv: "DEVELOPPEMENT HOTFIX" },
      { typenv: "POC92" },
      { typenv: "PRE-PRODUCTION" },
      { typenv: "PRODUCTION" },
      { typenv: "RECETTE" },
      { typenv: "QUALIFICATION" },
      { typenv: "REFERENCE LIVRAISON" },
      { typenv: "DEVOPS PACKAGING" }
    ];

    for (const update of updates) {
      const typenvRow = await prisma.psadm_typenv.findFirst({
        where: { typenv: update.typenv },
        select: { display: true },
      });

      if (typenvRow?.display == null) continue;

      // typenv n'est pas unique dans psadm_env => updateMany
      await prisma.psadm_env.updateMany({
        where: { typenv: update.typenv },
        data: { typenvid: typenvRow.display },
      });
    }

    return { success: "les environnements sont liÃ©s aux menux avec succÃ¨s !"};
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour des environnements", "lierTypeEnvs");
  }
};




export const lierEnvauTypeEnv = async () => {
  try {
      const updates = [
        { typenv: "PSADMIN" },
        { typenv: "TMA" },
        { typenv: "DEVOPS 1" },
        { typenv: "DEVOPS 2" },
        { typenv: "PUM-MAINTENANCE PS" },
        { typenv: "SECOURS - DRP" },
        { typenv: "DEVELOPPEMENT PROJET" },
        { typenv: "DEVOPS FUSION" },
        { typenv: "DEVELOPPEMENT HOTFIX" },
        { typenv: "POC92" },
        { typenv: "PRE-PRODUCTION" },
        { typenv: "PRODUCTION" },
        { typenv: "RECETTE" },
        { typenv: "QUALIFICATION" },
        { typenv: "REFERENCE LIVRAISON" },
        { typenv: "DEVOPS PACKAGING" }
      ];

      for (const update of updates) {
        const typenvDisplay = await prisma.psadm_typenv.findUnique({
          where: { typenv: update.typenv },
          select: { display: true }
        });

        if (typenvDisplay) {
          await prisma.psadm_env.updateMany({
            where: { typenv: update.typenv },
            data: { typenvid: typenvDisplay.display }
          });
        }
      }

      return { success: "Mise Ã  jour des typenvid effectuÃ©e avec succÃ¨s" };
    } catch (error) {
      return handlePrismaError(error, "Erreur lors de la mise Ã  jour des typenvid", "lierEnvauTypeEnv");
    }
  };



export const importerLesHarproles = async () => {
  try {

    // role n'est pas unique en base : le delta est fait ici, sur le libellÃ©.
    const catalog = [
      { role: 'DADS', descr: 'Acces Qualif DADS' },
      { role: 'DMOSTD', descr: 'Acces Demo Standard' },
      { role: 'DRP', descr: 'Acces DRP' },
      { role: 'EFO', descr: 'EFO Exploitation' },
      { role: 'FR-FT-UNIX', descr: 'Equipe FR-FT-UNIX' },
      { role: 'FT-MOE', descr: 'France Telecom MOE' },
      { role: 'HP_MUTUALISE', descr: 'Equipe UNIX/NETWORK/DBA/EFO HP' },
      { role: 'METRO', descr: 'Metrologie' },
      { role: 'POC92', descr: 'Acces POC' },
      { role: 'PORTAL_ADMIN', descr: 'Administrateur Portail Harp' },
      { role: 'PORTAL_SECURITY', descr: 'Administrateur securite Portail' },
      { role: 'PSADMIN', descr: 'Administrateur PeopleSoft' },
      { role: 'PUM', descr: 'Acces PUM' },
      { role: 'REF', descr: 'Acces References Livraison' },
      { role: 'REFRESH_INFOS', descr: 'Mise Ã  jour infos environnements' },
      { role: 'TMA_LOCAL', descr: 'Equipe TMA France' },
      { role: 'TMA_OFFSHORE', descr: 'Equipe TMA OFFSHORE' },
      { role: 'UPDSTATUS_DEV', descr: 'MAJ status environnements DEV' },
      { role: 'UPGRADE92', descr: 'Upgrade 9.2' }
    ];

    const existing = await prisma.harproles.findMany({
      select: { role: true },
    });
    const present = new Set(existing.map((row) => row.role));
    const missing = catalog.filter((row) => !present.has(row.role));

    if (missing.length === 0) {
      return { info: "Le seed harproles est dÃ©jÃ  complet. Aucune ligne manquante." };
    }

    if (existing.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harproles AUTO_INCREMENT = 1`;
    }

    await prisma.harproles.createMany({
      data: missing,
    });

    return { success: `${missing.length} rÃ´le(s) ajoutÃ©(s).` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des rÃ´les", "importerLesHarproles");
  }
};




/**
 * Mappe le typenvid de psadm_env vers le typenvid de harptypenv
 *
 * @param psadmTypenvId - Le typenvid depuis psadm_env (probablement psadm_typenv.display)
 * @returns Le typenvid correspondant dans harptypenv, ou null si non trouvÃ©
 */
async function mapTypenvIdToHarptypenv(psadmTypenvId: number | null): Promise<number | null> {
  if (psadmTypenvId === null) {
    return null;
  }

  try {
    // Chercher dans harptypenv un enregistrement dont le champ typenvid correspond
    const harptypenv = await prisma.harptypenv.findFirst({
      where: {
        typenvid: psadmTypenvId
      },
      select: {
        typenvid: true
      }
    });

    return harptypenv?.typenvid || null;
  } catch (error) {
    console.error(`[mapTypenvIdToHarptypenv] Erreur lors du mapping de typenvid ${psadmTypenvId}:`, error);
    return null;
  }
}

/**
 * Importe les environnements de psadm_env vers envsharp
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export async function importListEnvs() {
  try {
    // Lecture seule de psadm_env. Les dates legacy invalides deviennent NULL
    // ici, sans UPDATE de la source. typenvid n'est pas lu : il est dÃ©duit de typenv.
    const envData = await prisma.$queryRaw<Array<{
      env: string;
      aliasql: string | null;
      oraschema: string | null;
      url: string | null;
      appli: string | null;
      psversion: string | null;
      ptversion: string | null;
      harprelease: string | null;
      volum: string | null;
      datmaj: Date | null;
      gassi: string | null;
      rpg: string | null;
      msg: string | null;
      descr: string | null;
      anonym: string | null;
      edi: string | null;
      typenv: string | null;
    }>>`
      SELECT
        env,
        aliasql,
        oraschema,
        url,
        appli,
        psversion,
        ptversion,
        harprelease,
        volum,
        CASE
          WHEN datmaj IS NULL
            OR datmaj = '0000-00-00 00:00:00'
            OR datmaj = '0000-00-00'
            OR DATE(datmaj) = '0000-00-00'
          THEN NULL
          ELSE datmaj
        END AS datmaj,
        gassi,
        rpg,
        msg,
        descr,
        anonym,
        edi,
        typenv
      FROM psadm_env
    `;

    if (!envData.length) {
      return { warning: "Aucune donnÃ©e trouvÃ©e dans psadm_env" };
    }

    // RÃ©cupÃ©rer les environnements dÃ©jÃ  prÃ©sents dans envsharp
    const existingEnvs = await prisma.envsharp.findMany({
      select: {
        env: true
      }
    });

    // Si envsharp est vide (premier import), importer TOUT psadm_env.
    // Sinon, ne prendre que le delta (environnements manquants).
    let envsToImport: typeof envData;
    if (existingEnvs.length === 0) {
      envsToImport = envData;
    } else {
      const existingEnvSet = new Set(existingEnvs.map(e => e.env));
      envsToImport = envData.filter(record => !existingEnvSet.has(record.env));
    }

    // VÃ©rifier spÃ©cifiquement les environnements mentionnÃ©s par l'utilisateur
    const specificEnvs = ['FHFDMO','FHFPUM','FHFST1','FHFST2','FHFST3','FHHDMO','FHHPUM','FHHST1','FHHST2','FHHST3','FHXPUM'];
    const specificEnvsInSource = envData.filter(r => specificEnvs.includes(r.env));
    const specificEnvsInDestination = existingEnvs.filter(e => specificEnvs.includes(e.env));
    const specificEnvsToImport = envsToImport.filter(r => specificEnvs.includes(r.env));

    // Log pour debug
    console.log(`[importListEnvs] Environnements spÃ©cifiques - Source: ${specificEnvsInSource.length}, Destination: ${specificEnvsInDestination.length}, Ã€ importer: ${specificEnvsToImport.length}`);
    if (specificEnvsInSource.length > 0 && specificEnvsToImport.length === 0) {
      console.log(`[importListEnvs] ATTENTION: Les environnements spÃ©cifiques existent dans psadm_env mais sont dÃ©jÃ  dans envsharp ou ne seront pas importÃ©s`);
      console.log(`[importListEnvs] Environnements dans psadm_env:`, specificEnvsInSource.map(e => e.env));
      console.log(`[importListEnvs] Environnements dans envsharp:`, specificEnvsInDestination.map(e => e.env));
    }

    if (envsToImport.length === 0) {
      return {
        info: "Tous les environnements sont dÃ©jÃ  importÃ©s. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInPsadmEnv: envData.length,
          totalInEnvsharp: existingEnvs.length,
          imported: 0,
          specificEnvsInSource: specificEnvsInSource.length,
          specificEnvsInDestination: specificEnvsInDestination.length,
          specificEnvsToImport: specificEnvsToImport.length
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingEnvs.length === 0) {
      await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;
    }

    // RÃ©cupÃ©rer tous les typenvid valides depuis harptypenv pour validation
    const validHarptypenvTypenvIds = await prisma.harptypenv.findMany({
      select: {
        typenvid: true
      }
    });
    const validTypenvIdSet = new Set(validHarptypenvTypenvIds.map(t => t.typenvid).filter((id): id is number => id !== null));
    console.log(`[importListEnvs] ${validTypenvIdSet.size} typenvid valide(s) trouvÃ©(s) dans harptypenv`);

    // Correspondance calculÃ©e Ã  la lecture : psadm_env.typenv -> psadm_typenv.display
    // -> harptypenv.typenvid. psadm_env.typenvid n'est ni lu ni rÃ©Ã©crit.
    const typenvRows = await prisma.psadm_typenv.findMany({
      select: { typenv: true, display: true },
    });
    const displayByTypenv = new Map(typenvRows.map((row) => [row.typenv, row.display]));

    // PrÃ©parer les donnÃ©es Ã  importer avec validation et mapping
    const dataToImportPromises = envsToImport.map(async (record) => {
      // VÃ©rifier que les champs requis sont prÃ©sents
      if (!record.env) {
        console.error(`[importListEnvs] Environnement sans nom (env) ignorÃ©:`, record);
        return null;
      }

      // display legacy du type, rÃ©solu par le nom, sans Ã©crire dans psadm_env
      const legacyDisplay = record.typenv ? displayByTypenv.get(record.typenv) ?? null : null;
      const mappedTypenvId = await mapTypenvIdToHarptypenv(legacyDisplay);

      // VÃ©rifier que le typenvid mappÃ© existe dans harptypenv
      let finalTypenvId: number | null = mappedTypenvId;
      if (finalTypenvId !== null && !validTypenvIdSet.has(finalTypenvId)) {
        console.warn(`[importListEnvs] typenvid ${finalTypenvId} pour l'environnement ${record.env} n'existe pas dans harptypenv.typenvid. Mise Ã  null.`);
        finalTypenvId = null;
      }

      return {
        env: record.env,
        aliasql: record.aliasql || null,
        oraschema: record.oraschema || null,
        url: record.url || null,
        appli: record.appli || null,
        psversion: record.psversion || null,
        ptversion: record.ptversion || null,
        harprelease: record.harprelease || null,
        volum: record.volum || null,
        datmaj: record.datmaj || new Date(),
        gassi: record.gassi || null,
        rpg: record.rpg || null,
        msg: record.msg || null,
        descr: record.descr || null, // Peut Ãªtre null dans envsharp mÃªme si non-null dans psadm_env
        anonym: record.anonym || null,
        edi: record.edi || null,
        typenvid: finalTypenvId, // MappÃ© depuis psadm_env.typenvid vers harptypenv.typenvid
        statenvId: null
      };
    });

    const dataToImport = (await Promise.all(dataToImportPromises)).filter((item): item is NonNullable<typeof item> => item !== null);

    // VÃ©rifier les environnements spÃ©cifiques dans les donnÃ©es Ã  importer
    const specificEnvsInDataToImport = dataToImport.filter(d => specificEnvs.includes(d.env));
    if (specificEnvsInDataToImport.length > 0) {
      console.log(`[importListEnvs] Environnements spÃ©cifiques Ã  importer:`, specificEnvsInDataToImport.map(e => e.env));
    }

    // InsÃ©rer uniquement les nouveaux enregistrements
    const result = await prisma.envsharp.createMany({
      data: dataToImport,
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    // VÃ©rifier si les environnements spÃ©cifiques ont Ã©tÃ© importÃ©s
    // Note: On ne peut pas vÃ©rifier directement avec createMany, mais on sait qu'ils Ã©taient dans dataToImport
    const specificEnvsImportedCount = specificEnvsInDataToImport.length;

    if (specificEnvsInDataToImport.length > 0) {
      console.log(`[importListEnvs] ${specificEnvsImportedCount} environnement(s) spÃ©cifique(s) dans les donnÃ©es Ã  importer`);
    }

    return {
      success: `${result.count} nouveau(x) environnement(s) Harp importÃ©(s) avec succÃ¨s !`,
      details: {
        totalInPsadmEnv: envData.length,
        totalInEnvsharp: existingEnvs.length + result.count,
        imported: result.count,
        skipped: envData.length - envsToImport.length,
        specificEnvsInSource: specificEnvsInSource.length,
        specificEnvsInDestination: specificEnvsInDestination.length,
        specificEnvsToImport: specificEnvsToImport.length,
        specificEnvsImported: specificEnvsImportedCount
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des environnements Harp", "importListEnvs");
  }
}

/**
 * Force l'import de certains environnements spÃ©cifiques depuis psadm_env vers envsharp
 * Cette fonction supprime d'abord les environnements existants puis les rÃ©importe
 *
 * IMPORTANT:
 * - Il faut absolument exÃ©cuter lierTypeEnvs() avant cette fonction pour remplir
 *   le champ typenvid dans psadm_env
 * - Le typenvid de psadm_env est automatiquement mappÃ© vers harptypenv.typenvid
 *   (la relation se fait maintenant sur harptypenv.typenvid, pas harptypenv.id)
 *
 * @param envNames - Tableau des noms d'environnements Ã  forcer (optionnel, utilise la liste par dÃ©faut si non fourni)
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export async function forceImportSpecificEnvs(envNames?: string[]) {
  try {
    // Liste par dÃ©faut des environnements Ã  forcer
    const specificEnvs = envNames || ['FHFDMO','FHFPUM','FHFST1','FHFST2','FHFST3','FHHDMO','FHHPUM','FHHST1','FHHST2','FHHST3','FHXPUM'];

    console.log(`[forceImportSpecificEnvs] DÃ©but de l'import forcÃ© pour ${specificEnvs.length} environnement(s):`, specificEnvs);

    // RÃ©cupÃ©rer les donnÃ©es de ces environnements depuis psadm_env
    const envData = await prisma.psadm_env.findMany({
      where: {
        env: {
          in: specificEnvs
        }
      }
    });

    if (envData.length === 0) {
      return {
        warning: "Aucun des environnements spÃ©cifiÃ©s n'a Ã©tÃ© trouvÃ© dans psadm_env",
        details: {
          requested: specificEnvs.length,
          found: 0,
          imported: 0
        }
      };
    }

    console.log(`[forceImportSpecificEnvs] ${envData.length} environnement(s) trouvÃ©(s) dans psadm_env:`, envData.map(e => e.env));

    // VÃ©rifier quels environnements existent dÃ©jÃ  dans envsharp
    const existingEnvs = await prisma.envsharp.findMany({
      where: {
        env: {
          in: envData.map(e => e.env)
        }
      },
      select: {
        env: true
      }
    });

    const existingEnvNames = existingEnvs.map(e => e.env);
    console.log(`[forceImportSpecificEnvs] ${existingEnvNames.length} environnement(s) existant(s) dans envsharp:`, existingEnvNames);

    // Supprimer les environnements existants pour forcer la rÃ©importation
    // IMPORTANT: Il faut d'abord supprimer les enregistrements dÃ©pendants (harpenvinfo, harpmonitor, harpenvdispo)
    let deletedCount = 0;
    if (existingEnvNames.length > 0) {
      // RÃ©cupÃ©rer les IDs des environnements Ã  supprimer
      const envsToDelete = await prisma.envsharp.findMany({
        where: {
          env: {
            in: existingEnvNames
          }
        },
        select: {
          id: true
        }
      });
      const envIdsToDelete = envsToDelete.map(e => e.id);

      if (envIdsToDelete.length > 0) {
        // Supprimer les enregistrements dÃ©pendants dans l'ordre (pour Ã©viter les contraintes de clÃ© Ã©trangÃ¨re)
        await prisma.harpenvinfo.deleteMany({
          where: {
            envId: {
              in: envIdsToDelete
            }
          }
        });
        console.log(`[forceImportSpecificEnvs] Enregistrements harpenvinfo supprimÃ©s`);

        await prisma.harpmonitor.deleteMany({
          where: {
            envId: {
              in: envIdsToDelete
            }
          }
        });
        console.log(`[forceImportSpecificEnvs] Enregistrements harpmonitor supprimÃ©s`);

        await prisma.harpenvdispo.deleteMany({
          where: {
            envId: {
              in: envIdsToDelete
            }
          }
        });
        console.log(`[forceImportSpecificEnvs] Enregistrements harpenvdispo supprimÃ©s`);
      }

      // Maintenant supprimer les environnements eux-mÃªmes
      const deleteResult = await prisma.envsharp.deleteMany({
        where: {
          env: {
            in: existingEnvNames
          }
        }
      });
      deletedCount = deleteResult.count;
      console.log(`[forceImportSpecificEnvs] ${deletedCount} environnement(s) supprimÃ©(s) de envsharp`);
    }

    // RÃ©cupÃ©rer tous les typenvid valides depuis harptypenv pour vÃ©rifier les contraintes de clÃ© Ã©trangÃ¨re
    // IMPORTANT: On utilise maintenant harptypenv.typenvid (pas harptypenv.id)
    const validHarptypenvTypenvIds = await prisma.harptypenv.findMany({
      select: {
        typenvid: true
      }
    });
    const validTypenvIdSet = new Set(validHarptypenvTypenvIds.map(t => t.typenvid).filter((id): id is number => id !== null));
    console.log(`[forceImportSpecificEnvs] ${validTypenvIdSet.size} typenvid valide(s) trouvÃ©(s) dans harptypenv.typenvid`);

    // PrÃ©parer les donnÃ©es Ã  importer avec mapping depuis psadm_env.typenvid vers harptypenv.typenvid
    // Note: typenvid doit Ãªtre rempli dans psadm_env par lierTypeEnvs() avant d'appeler cette fonction
    const dataToImportPromises = envData.map(async (record) => {
      if (!record.env) {
        console.error(`[forceImportSpecificEnvs] Environnement sans nom (env) ignorÃ©:`, record);
        return null;
      }

      // Mapper le typenvid de psadm_env vers harptypenv.typenvid
      const mappedTypenvId = await mapTypenvIdToHarptypenv(record.typenvid || null);

      // VÃ©rifier que le typenvid mappÃ© existe dans harptypenv.typenvid
      let typenvid: number | null = mappedTypenvId;
      if (typenvid !== null && !validTypenvIdSet.has(typenvid)) {
        console.warn(`[forceImportSpecificEnvs] typenvid ${typenvid} pour l'environnement ${record.env} n'existe pas dans harptypenv.typenvid. Mise Ã  null.`);
        typenvid = null;
      }

      return {
        env: record.env,
        aliasql: record.aliasql || null,
        oraschema: record.oraschema || null,
        url: record.url || null,
        appli: record.appli || null,
        psversion: record.psversion || null,
        ptversion: record.ptversion || null,
        harprelease: record.harprelease || null,
        volum: record.volum || null,
        datmaj: record.datmaj || new Date(),
        gassi: record.gassi || null,
        rpg: record.rpg || null,
        msg: record.msg || null,
        descr: record.descr || null,
        anonym: record.anonym || null,
        edi: record.edi || null,
        typenvid: typenvid, // MappÃ© depuis psadm_env.typenvid vers harptypenv.typenvid et validÃ©
        statenvId: null
      };
    });

    const dataToImport = (await Promise.all(dataToImportPromises)).filter((item): item is NonNullable<typeof item> => item !== null);

    console.log(`[forceImportSpecificEnvs] ${dataToImport.length} environnement(s) prÃ©parÃ©(s) pour l'import`);
    if (dataToImport.length > 0) {
      console.log(`[forceImportSpecificEnvs] Exemple de donnÃ©es Ã  importer:`, JSON.stringify(dataToImport[0], null, 2));
    }

    // InsÃ©rer les environnements un par un pour mieux identifier les erreurs
    let importedCount = 0;
    const errors: string[] = [];

    for (const data of dataToImport) {
      try {
        await prisma.envsharp.create({
          data: data
        });
        importedCount++;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${data.env}: ${errorMsg}`);
        console.error(`[forceImportSpecificEnvs] Erreur lors de l'import de ${data.env}:`, error);
      }
    }

    console.log(`[forceImportSpecificEnvs] ${importedCount} environnement(s) importÃ©(s) avec succÃ¨s`);
    if (errors.length > 0) {
      console.error(`[forceImportSpecificEnvs] ${errors.length} erreur(s) lors de l'import:`, errors);
    }

    if (importedCount === 0 && errors.length > 0) {
      return {
        error: `Aucun environnement n'a pu Ãªtre importÃ©. ${errors.length} erreur(s) rencontrÃ©e(s).`,
        details: {
          requested: specificEnvs.length,
          foundInSource: envData.length,
          deleted: deletedCount,
          imported: importedCount,
          errors: errors,
          environments: envData.map(e => e.env)
        }
      };
    }

    if (importedCount < dataToImport.length) {
      return {
        warning: `${importedCount} environnement(s) importÃ©(s) sur ${dataToImport.length} (${errors.length} erreur(s))`,
        details: {
          requested: specificEnvs.length,
          foundInSource: envData.length,
          deleted: deletedCount,
          imported: importedCount,
          errors: errors,
          environments: envData.map(e => e.env)
        }
      };
    }

    return {
      success: `${importedCount} environnement(s) spÃ©cifique(s) importÃ©(s) avec succÃ¨s (${deletedCount} supprimÃ©(s) puis rÃ©importÃ©(s)) !`,
      details: {
        requested: specificEnvs.length,
        foundInSource: envData.length,
        deleted: deletedCount,
        imported: importedCount,
        environments: envData.map(e => e.env)
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'import forcÃ© des environnements spÃ©cifiques", "forceImportSpecificEnvs");
  }
}



/**
 * Importe les instances Oracle de psadm_oracle vers harpora
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importInstanceOra = async () => {
  try {
    // VÃ©rifier si la table envsharp contient des donnÃ©es
    const countEnvsharp = await prisma.envsharp.count();

    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // RÃ©cupÃ©rer toutes les donnÃ©es avec un JOIN entre envsharp et psadm_oracle
    const allInstances = await prisma.$queryRaw<Array<{
      envId: number;
      oracle_sid: string;
      aliasql: string;
      oraschema: string;
      descr: string | null;
      orarelease: string | null;
    }>>`
      SELECT
        e.id as envId,
        o.oracle_sid,
        o.aliasql,
        o.oraschema,
        o.descr,
        o.orarelease
      FROM envsharp e
      JOIN psadm_oracle o ON e.env = o.aliasql
      ORDER BY e.id ASC
    `;

    if (allInstances.length === 0) {
      return { info: "Aucune instance Oracle trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les instances dÃ©jÃ  prÃ©sentes dans harpora
    const existingInstances = await prisma.harpora.findMany({
      select: {
        envId: true,
        oracle_sid: true,
        aliasql: true,
        oraschema: true
      }
    });

    // CrÃ©er un Set des instances existantes pour une recherche rapide
    // ClÃ© unique: envId + oracle_sid + aliasql + oraschema
    const existingInstancesSet = new Set(
      existingInstances.map(inst =>
        `${inst.envId}-${inst.oracle_sid}-${inst.aliasql}-${inst.oraschema}`
      )
    );

    // Filtrer uniquement les instances qui n'existent pas encore (delta)
    const instancesToImport = allInstances.filter(instance => {
      const key = `${instance.envId}-${instance.oracle_sid}-${instance.aliasql}-${instance.oraschema}`;
      return !existingInstancesSet.has(key);
    });

    if (instancesToImport.length === 0) {
      return {
        info: "Toutes les instances Oracle sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allInstances.length,
          totalInHarpora: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles instances
    const importedData = await prisma.harpora.createMany({
      data: instancesToImport.map(instance => ({
        envId: instance.envId,
        oracle_sid: instance.oracle_sid,
        aliasql: instance.aliasql,
        oraschema: instance.oraschema,
        descr: instance.descr,
        orarelease: instance.orarelease
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allInstances.length,
        totalInHarpora: existingInstances.length + importedData.count,
        imported: importedData.count,
        skipped: allInstances.length - instancesToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation d'instances d'environnements", "importInstanceOra");
  }
};




// export async function importListEnvs() {
//   try {
//     // VÃ©rifier si la table est vide
//     const count = await prisma.envsharp.count();

//     if (count > 0) {
//       return { info: "La table envsharp contient dÃ©jÃ  tous les environnements Harp. Importation ignorÃ©e." };
//     }

//     // RÃ©initialiser l'auto-increment
//     await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

//     // RÃ©cupÃ©rer les donnÃ©es de psadm_env
//     const envData = await prisma.psadm_env.findMany({
//       select: {
//         env: true,
//         url: true,
//         appli: true,
//         psversion: true,
//         ptversion: true,
//         harprelease: true,
//         volum: true,
//         datmaj: true,
//         gassi: true,
//         rpg: true,
//         msg: true,
//         descr: true,
//         anonym: true,
//         edi: true,
//         typenvid: true,
//         statenvId: true
//       }
//     });

//     // InsÃ©rer les donnÃ©es dans envsharp
//     const result = await prisma.envsharp.createMany({
//       data: envData
//     });

//     return { success: `${result.count} environnements Harp importÃ©s avec succÃ¨s !` };
//   } catch (error) {
//     console.error("Erreur lors de l'importation des environnements Harp:", error);
//     return { error: "Erreur lors de l'importation des environnements Harp" };
//   }
// }



/**
 * Importe les instances Oracle de psadm_oracle vers harpora (version alternative)
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerInstancesOracle = async () => {
  try {
    // VÃ©rifier si la table envsharp contient des donnÃ©es
    const countEnvsharp = await prisma.envsharp.count();

    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // RÃ©cupÃ©rer toutes les donnÃ©es depuis les tables existantes
    const allResults = await prisma.$queryRaw<Array<{
      envId: number;
      oracle_sid: string;
      aliasql: string;
      oraschema: string;
      descr: string | null;
      orarelease: string | null;
    }>>`
      SELECT
        e.id as envId,
        h.oracle_sid,
        h.aliasql,
        h.oraschema,
        h.descr,
        h.orarelease
      FROM envsharp e, psadm_oracle h
      WHERE e.env = h.aliasql
      ORDER BY e.id ASC
    `;

    if (allResults.length === 0) {
      return { info: "Aucune instance Oracle trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les instances dÃ©jÃ  prÃ©sentes dans harpora
    const existingInstances = await prisma.harpora.findMany({
      select: {
        envId: true,
        oracle_sid: true,
        aliasql: true,
        oraschema: true
      }
    });

    // CrÃ©er un Set des instances existantes pour une recherche rapide
    const existingInstancesSet = new Set(
      existingInstances.map(inst =>
        `${inst.envId}-${inst.oracle_sid}-${inst.aliasql}-${inst.oraschema}`
      )
    );

    // Filtrer uniquement les instances qui n'existent pas encore (delta)
    const instancesToImport = allResults.filter(result => {
      const key = `${result.envId}-${result.oracle_sid}-${result.aliasql}-${result.oraschema}`;
      return !existingInstancesSet.has(key);
    });

    if (instancesToImport.length === 0) {
      return {
        info: "Toutes les instances Oracle sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpora: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles instances
    const importedData = await prisma.harpora.createMany({
      data: instancesToImport.map(result => ({
        envId: result.envId,
        oracle_sid: result.oracle_sid,
        aliasql: result.aliasql,
        oraschema: result.oraschema,
        descr: result.descr,
        orarelease: result.orarelease
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpora: existingInstances.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - instancesToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des instances Oracle", "importerInstancesOracle");
  }
};


export async function migrerLesUtilisateurs() {
  try {
     // VÃ©rifier si la table psadm_user contient des utilisateurs
     const psadmUserCount = await prisma.psadm_user.count();

     if (psadmUserCount === 0) {
       return { error: "La table psadm_user est vide. Aucun utilisateur Ã  migrer." };
     }

     // VÃ©rifier le nombre d'utilisateurs dans la table User
     const userCount = await prisma.user.count();
     console.log(`[Migration] Nombre d'utilisateurs dans User: ${userCount}, dans psadm_user: ${psadmUserCount}`);

     // FORCER l'import de tous les utilisateurs manquants, mÃªme si la table User n'est pas vide
     // La table User contient les authentifications, donc on doit toujours synchroniser avec psadm_user

     // RÃ©cupÃ©rer tous les utilisateurs de psadm_user
    const psadmUsers = await prisma.psadm_user.findMany()

    if (psadmUsers.length === 0) {
      return { error: "Aucun utilisateur trouvÃ© dans psadm_user." };
    }

    console.log(`[Migration] DÃ©but de la migration de ${psadmUsers.length} utilisateurs...`)

    let importedCount = 0;
    let skippedCount = 0;

    // Pour chaque utilisateur dans psadm_user
    for (const user of psadmUsers) {
      // VÃ©rifier si l'utilisateur existe dÃ©jÃ  dans la table User
      const existingUser = await prisma.user.findUnique({
        where: { netid: user.netid }
      })

      if (!existingUser) {
        try {
          // CrÃ©er le nouvel utilisateur dans la table User
          await prisma.user.create({
            data: {
              netid: user.netid,
              unxid: user.unxid,
              oprid: user.oprid,
              nom: user.nom,
              prenom: user.prenom,
              name: `${user.nom || ''} ${user.prenom || ''}`.trim() || user.netid,
              pkeyfile: user.pkeyfile,
              lastlogin: user.lastlogin,
              email: user.email,
              password: user.mdp,
            }
          })
          importedCount++;
          console.log(`[Migration] Utilisateur migrÃ© avec succÃ¨s: ${user.netid}`)
        } catch (createError) {
          console.error(`[Migration] Erreur lors de la crÃ©ation de l'utilisateur ${user.netid}:`, createError);
          // Continuer avec les autres utilisateurs
        }
      } else {
        skippedCount++;
        console.log(`[Migration] L'utilisateur ${user.netid} existe dÃ©jÃ , ignorÃ©.`)
      }
    }

    // Toujours retourner un message, mÃªme si aucun utilisateur n'a Ã©tÃ© importÃ©
    // Cela permet de forcer l'import mÃªme si la table User n'est pas vide
    if (importedCount === 0 && skippedCount > 0) {
      return { info: `Synchronisation terminÃ©e : Tous les utilisateurs (${skippedCount}) existent dÃ©jÃ  dans la table User. Aucun nouvel utilisateur Ã  importer.` };
    }

    return { success: `${importedCount} utilisateur(s) importÃ©(s) avec succÃ¨s ! ${skippedCount > 0 ? `(${skippedCount} dÃ©jÃ  existant(s), ignorÃ©(s))` : ''}` };
  } catch (error) {
    console.error("[Migration] Erreur lors de la migration des utilisateurs:", error);
    return handlePrismaError(error, "Erreur lors de la migration des utilisateurs vers Prisma.", "migrerLesUtilisateurs");
  } finally {
    // Ne pas dÃ©connecter ici car cela peut causer des problÃ¨mes avec d'autres opÃ©rations
    // await prisma.$disconnect()
  }
};

/**
 * Migre les rÃ´les utilisateurs de psadm_roleuser vers harpuseroles
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const migrerLesRolesUtilisateurs = async () => {
  try {
    // VÃ©rifier si la table user est vide
    const countuser = await prisma.user.count();

    if (countuser === 0) {
      return { info: "La table user est vide. Vous devez d'abord importer les utilisateurs. Importation ignorÃ©e." };
    }

    // RÃ©cupÃ©rer toutes les donnÃ©es avec la requÃªte fournie
    const allResults = await prisma.$queryRaw<Array<{
      userid: number;
      roleid: number;
      datmaj: Date | null;
    }>>`
      SELECT u.id as userid, h.id as roleid, pr.datmaj
      FROM \`user\` u, psadm_roleuser pr, harproles h
      WHERE u.netid = pr.netid AND h.role = pr.role
    `;

    if (allResults.length === 0) {
      return { info: "Aucune association utilisateur-rÃ´le trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les associations dÃ©jÃ  prÃ©sentes dans harpuseroles
    const existingAssociations = await prisma.harpuseroles.findMany({
      select: {
        userId: true,
        roleId: true
      }
    });

    // CrÃ©er un Set des associations existantes pour une recherche rapide
    // ClÃ© unique: userId + roleId (clÃ© primaire composite)
    const existingAssociationsSet = new Set(
      existingAssociations.map(assoc => `${assoc.userId}-${assoc.roleId}`)
    );

    // Filtrer uniquement les associations qui n'existent pas encore (delta)
    const associationsToImport = allResults.filter(result => {
      const key = `${result.userid}-${result.roleid}`;
      return !existingAssociationsSet.has(key);
    });

    if (associationsToImport.length === 0) {
      return {
        info: "Toutes les associations utilisateur-rÃ´le sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpuseroles: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpuseroles AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles associations
    const importedData = await prisma.harpuseroles.createMany({
      data: associationsToImport.map(result => ({
        userId: result.userid,
        roleId: result.roleid,
        datmaj: result.datmaj || new Date()
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) association(s) utilisateur-rÃ´le migrÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpuseroles: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la migration des rÃ´les utilisateurs", "migrerLesRolesUtilisateurs");
  }
};



export const verifierDoublonsOracleSid1 = async () => {
  try {
    // Rechercher les oracle_sid en double
    const doublons = await prisma.harpora.groupBy({
      by: ['oracle_sid'],
      _count: {
        oracle_sid: true
      },
      having: {
        oracle_sid: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (doublons.length === 0) {
      return { success: "Aucun doublon trouvÃ© sur oracle_sid" };
    }

    // RÃ©cupÃ©rer les dÃ©tails des enregistrements en doublon
    const detailsDoublons = await Promise.all(
      doublons.map(async (doublon) => {
        const instances = await prisma.harpora.findMany({
          where: {
            oracle_sid: doublon.oracle_sid
          }
        });

        const envIds = Array.from(new Set(instances.map((i: any) => i.envId).filter((v: any) => typeof v === "number")));
        const envs = envIds.length
          ? await prisma.envsharp.findMany({ where: { id: { in: envIds } }, select: { id: true, env: true } })
          : [];
        const envMap = new Map(envs.map(e => [e.id, e.env]));

        return {
          oracle_sid: doublon.oracle_sid,
          occurrences: doublon._count.oracle_sid,
          environnements: instances.map(inst => ({
            id: inst.id,
            env: envMap.get((inst as any).envId) ?? null,
            aliasql: inst.aliasql,
            oraschema: inst.oraschema
          }))
        };
      })
    );

    return {
      warning: "Doublons trouvÃ©s sur oracle_sid",
      details: detailsDoublons
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la vÃ©rification des doublons sur oracle_sid", "verifierDoublonsOracleSid1");
  }
};



export const verifierDoublonsOracleSid = async () => {
  try {
    // Rechercher les oracle_sid en double
    const doublons = await prisma.harpora.groupBy({
      by: ['oracle_sid'],
      _count: {
        oracle_sid: true
      },
      having: {
        oracle_sid: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (doublons.length === 0) {
      return { success: "Aucun doublon trouvÃ© sur oracle_sid" };
    }

    // RÃ©cupÃ©rer les dÃ©tails des enregistrements en doublon
    const detailsDoublons = await Promise.all(
      doublons.map(async (doublon) => {
        const instances = await prisma.harpora.findMany({
          where: {
            oracle_sid: doublon.oracle_sid
          },
          orderBy: {
            id: 'asc'
          }
        });

        const envIds = Array.from(new Set(instances.map((i: any) => i.envId).filter((v: any) => typeof v === "number")));
        const envs = envIds.length
          ? await prisma.envsharp.findMany({ where: { id: { in: envIds } }, select: { id: true, env: true } })
          : [];
        const envMap = new Map(envs.map(e => [e.id, e.env]));

        return {
          oracle_sid: doublon.oracle_sid,
          occurrences: doublon._count.oracle_sid,
          environnements: instances.map(inst => ({
            id: inst.id,
            env: envMap.get((inst as any).envId) ?? null,
            aliasql: inst.aliasql,
            oraschema: inst.oraschema
          }))
        };
      })
    );

    return {
      warning: `${doublons.length} doublons trouvÃ©s sur oracle_sid`,
      details: detailsDoublons
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la vÃ©rification des doublons sur oracle_sid", "verifierDoublonsOracleSid");
  }
};



/**
 * Importe les versions PeopleSoft de psadm_version vers psoftversion
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesPsoftVersions = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es de psadm_version
    const allVersions = await prisma.$queryRaw<Array<{
      psversion: string;
      ptversion: string;
      harprelease: string;
      descr: string | null;
    }>>`
      SELECT psversion, ptversion, harprelease, descr
      FROM psadm_version
    `;

    if (allVersions.length === 0) {
      return { info: "Aucune version PeopleSoft trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les versions dÃ©jÃ  prÃ©sentes dans psoftversion
    const existingVersions = await prisma.psoftversion.findMany({
      select: {
        psversion: true,
        ptversion: true,
        harprelease: true
      }
    });

    // CrÃ©er un Set des versions existantes pour une recherche rapide
    // ClÃ© unique: psversion + ptversion + harprelease
    const existingVersionsSet = new Set(
      existingVersions.map(ver => `${ver.psversion}-${ver.ptversion}-${ver.harprelease}`)
    );

    // Filtrer uniquement les versions qui n'existent pas encore (delta)
    const versionsToImport = allVersions.filter(version => {
      const key = `${version.psversion}-${version.ptversion}-${version.harprelease}`;
      return !existingVersionsSet.has(key);
    });

    if (versionsToImport.length === 0) {
      return {
        info: "Toutes les versions PeopleSoft sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allVersions.length,
          totalInPsoftversion: existingVersions.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingVersions.length === 0) {
      await prisma.$executeRaw`ALTER TABLE psoftversion AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles versions
    const result = await prisma.psoftversion.createMany({
      data: versionsToImport.map(version => ({
        psversion: version.psversion,
        ptversion: version.ptversion,
        harprelease: version.harprelease,
        descr: version.descr
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${result.count} nouvelle(s) version(s) PeopleSoft importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allVersions.length,
        totalInPsoftversion: existingVersions.length + result.count,
        imported: result.count,
        skipped: allVersions.length - versionsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des versions PeopleSoft", "importerLesPsoftVersions");
  }
};

/**
 * Importe les versions PeopleTools de psadm_ptools vers ptoolsversion
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesPToolsVersions = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es de psadm_ptools
    const allVersions = await prisma.$queryRaw<Array<{
      ptversion: string;
      descr: string | null;
    }>>`
      SELECT ptversion, descr
      FROM psadm_ptools
    `;

    if (allVersions.length === 0) {
      return { info: "Aucune version PeopleTools trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les versions dÃ©jÃ  prÃ©sentes dans ptoolsversion
    const existingVersions = await prisma.ptoolsversion.findMany({
      select: {
        ptversion: true
      }
    });

    // CrÃ©er un Set des versions existantes pour une recherche rapide
    // ClÃ© unique: ptversion
    const existingVersionsSet = new Set(existingVersions.map(ver => ver.ptversion));

    // Filtrer uniquement les versions qui n'existent pas encore (delta)
    const versionsToImport = allVersions.filter(version =>
      !existingVersionsSet.has(version.ptversion)
    );

    if (versionsToImport.length === 0) {
      return {
        info: "Toutes les versions PeopleTools sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allVersions.length,
          totalInPtoolsversion: existingVersions.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingVersions.length === 0) {
      await prisma.$executeRaw`ALTER TABLE ptoolsversion AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles versions
    const result = await prisma.ptoolsversion.createMany({
      data: versionsToImport.map(version => ({
        ptversion: version.ptversion,
        descr: version.descr
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${result.count} nouvelle(s) version(s) PeopleTools importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allVersions.length,
        totalInPtoolsversion: existingVersions.length + result.count,
        imported: result.count,
        skipped: allVersions.length - versionsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des versions PeopleTools", "importerLesPToolsVersions");
  }
};


/**
 * Migre les versions Harp de psadm_release vers releaseenv
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const migrateReleaseData = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es source
    const allReleases = await prisma.psadm_release.findMany({
      select: {
        harprelease: true,
        descr: true,
      },
    });

    if (allReleases.length === 0) {
      return { info: "Aucune donnÃ©e Ã  migrer depuis psadm_release." };
    }

    // RÃ©cupÃ©rer les releases dÃ©jÃ  prÃ©sentes dans releaseenv
    const existingReleases = await prisma.releaseenv.findMany({
      select: {
        harprelease: true
      }
    });

    // CrÃ©er un Set des releases existantes pour une recherche rapide
    // ClÃ© unique: harprelease
    const existingReleasesSet = new Set(existingReleases.map(rel => rel.harprelease));

    // Filtrer uniquement les releases qui n'existent pas encore (delta)
    const releasesToImport = allReleases.filter(release =>
      !existingReleasesSet.has(release.harprelease)
    );

    if (releasesToImport.length === 0) {
      return {
        info: "Toutes les versions Harp sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allReleases.length,
          totalInReleaseenv: existingReleases.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingReleases.length === 0) {
      await prisma.$executeRaw`ALTER TABLE releaseenv AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles releases
    const result = await prisma.releaseenv.createMany({
      data: releasesToImport.map(release => ({
        harprelease: release.harprelease,
        descr: release.descr,
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `Migration rÃ©ussie : ${result.count} nouvelle(s) version(s) Harp migrÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allReleases.length,
        totalInReleaseenv: existingReleases.length + result.count,
        imported: result.count,
        skipped: allReleases.length - releasesToImport.length
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la migration des versions Harp", "migrateReleaseData");
  }
};


// ... existing code ...

/**
 * Importe les types d'environnement de psadm_typenv vers harptypenv
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesTypesEnv = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es de psadm_typenv
    const allTypenvData = await prisma.psadm_typenv.findMany({
      select: {
        display: true,
        typenv: true,
        descr: true
      }
    });

    if (allTypenvData.length === 0) {
      return { info: "Aucun type d'environnement trouvÃ© Ã  importer." };
    }

    // RÃ©cupÃ©rer les types d'environnement dÃ©jÃ  prÃ©sents dans harptypenv
    const existingTypenvs = await prisma.harptypenv.findMany({
      select: {
        typenv: true
      }
    });

    // CrÃ©er un Set des types d'environnement existants pour une recherche rapide
    // ClÃ© unique: typenv
    const existingTypenvsSet = new Set(existingTypenvs.map(te => te.typenv));

    // Filtrer uniquement les types d'environnement qui n'existent pas encore (delta)
    const typenvsToImport = allTypenvData.filter(record =>
      !existingTypenvsSet.has(record.typenv)
    );

    if (typenvsToImport.length === 0) {
      return {
        info: "Tous les types d'environnement sont dÃ©jÃ  importÃ©s. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allTypenvData.length,
          totalInHarptypenv: existingTypenvs.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingTypenvs.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harptypenv AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouveaux types d'environnement
    const result =     // typenvid = psadm_typenv.display, clÃ© mÃ©tier du type, pas l'id auto-incrÃ©mentÃ©.
    // Les lignes dÃ©jÃ  prÃ©sentes ne sont pas rÃ©Ã©crites.
    await prisma.harptypenv.createMany({
      data: typenvsToImport.map(record => ({
        typenv: record.typenv,
        href: `/list/envs/${record.display}`,
        descr: record.descr,
        typenvid: record.display
      })),
      skipDuplicates: true
    });

    return {
      success: `${result.count} nouveau(x) type(s) d'environnement importÃ©(s) avec succÃ¨s !`,
      details: {
        totalInSource: allTypenvData.length,
        totalInHarptypenv: existingTypenvs.length + result.count,
        imported: result.count,
        skipped: allTypenvData.length - typenvsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des types d'environnement", "importerLesTypesEnv");
  }
};

// ... existing code ...

export const updateReleaseEnvIds = async () => {
  try {

     // VÃ©rifier si la table releaseenv contient des donnÃ©es
     const countEnvs = await prisma.envsharp.count();

     if (countEnvs === 0) {
       return { info: "La table envsharp est vide. Veuillez d'abord importer les environements." };
     }
    // VÃ©rifier si la table releaseenv contient des donnÃ©es
    const countReleases = await prisma.releaseenv.count();

    if (countReleases === 0) {
      return { info: "La table releaseenv est vide. Veuillez d'abord importer les releases." };
    }

    // RÃ©cupÃ©rer tous les environnements et leurs releases
    const envs = await prisma.envsharp.findMany();
    const releases = await prisma.releaseenv.findMany();

    // Mettre Ã  jour chaque environnement (sÃ©quentiellement pour Ã©viter les conflits de concurrence)
    let updateCount = 0;
    for (const env of envs) {
      const matchingRelease = releases.find(
        release => release.harprelease === env.harprelease
      );

      if (matchingRelease) {
        await prisma.envsharp.update({
          where: { id: env.id },
          data: { releaseId: matchingRelease.id }
        });
        updateCount++;
      }
    }

    return { success: `${updateCount} environnements mis Ã  jour avec leur releaseId !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour des releaseId de ENVSHARP", "updateReleaseEnvIds");
  }
};

/**
 * Migre les serveurs de psadm_srv vers harpserve
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const migrateServers = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es de psadm_srv
    const allPsadmSrvData = await prisma.psadm_srv.findMany();

    if (allPsadmSrvData.length === 0) {
      return { info: "La table psadm_srv est vide." };
    }

    // RÃ©cupÃ©rer les serveurs dÃ©jÃ  prÃ©sents dans harpserve
    const existingServers = await prisma.harpserve.findMany({
      select: {
        srv: true
      }
    });

    // Si harpserve est vide (premier import), importer TOUS les serveurs.
    // Sinon, ne prendre que le delta (serveurs manquants).
    let serversToImport: typeof allPsadmSrvData;
    if (existingServers.length === 0) {
      serversToImport = allPsadmSrvData;
    } else {
      const existingServersSet = new Set(existingServers.map(srv => srv.srv));
      serversToImport = allPsadmSrvData.filter(record =>
        !existingServersSet.has(record.srv)
      );
    }

    if (serversToImport.length === 0) {
      return {
        info: "Tous les serveurs sont dÃ©jÃ  importÃ©s. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allPsadmSrvData.length,
          totalInHarpserve: existingServers.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingServers.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpserve AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouveaux serveurs (statenvId Ã  null pour Ã©viter FK si statutenv manquant)
    const result = await prisma.harpserve.createMany({
      data: serversToImport.map(record => ({
        srv: record.srv,
        ip: record.ip,
        pshome: record.pshome,
        os: record.os,
        psuser: record.psuser,
        domain: record.domain,
        statenvId: null,
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    console.log(`Migration terminÃ©e. ${result.count} enregistrements insÃ©rÃ©s.`);
    return {
      success: `${result.count} nouveau(x) serveur(s) insÃ©rÃ©(s) dans HARPSERV !`,
      details: {
        totalInSource: allPsadmSrvData.length,
        totalInHarpserve: existingServers.length + result.count,
        imported: result.count,
        skipped: allPsadmSrvData.length - serversToImport.length
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'import dans HARPSERV", "migrateServers");
  }
};

export const migrateDataToEnvsharp = async () => {

    try {
    // VÃ©rifier si envsharp est vide
    const envsharpCount = await prisma.envsharp.count()

    if (envsharpCount > 0) {
       return { info: "La table envsharp n'est pas vide." };
    }

    // RÃ©cupÃ©rer les donnÃ©es de psadm_env
    const psadmEnvData = await prisma.psadm_env.findMany()


    if (psadmEnvData.length === 0) {
      return { info: "La table psadm_env est vide." };
   }

     // RÃ©initialiser l'auto-increment
     await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

    // InsÃ©rer les donnÃ©es dans envsharp
    const result = await prisma.envsharp.createMany({
      data: psadmEnvData.map(record => ({
        env: record.env,
        url: record.url,
        appli: record.appli,
        psversion: record.psversion,
        ptversion: record.ptversion,
        harprelease: record.harprelease,
        volum: record.volum,
        datmaj: record.datmaj,
        gassi: record.gassi,
        rpg: record.rpg,
        msg: record.msg,
        descr: record.descr,
        anonym: record.anonym,
        edi: record.edi,
        typenvid: record.typenvid,
        statenvId: null
      }))
    })

    console.log(`Migration terminÃ©e. ${result.count} enregistrements insÃ©rÃ©s.`)
    return { success: `${result.count} enregistrements insÃ©rÃ©s dans ENVSHARP !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'import dans ENVSHARP", "migrateDataToEnvsharp");
  // } finally {
  //   await prisma.$disconnect()
  }
};

// ... existing code ...

export const migrerLesUtilisateursNEW = async () => {
  try {
    // VÃ©rifier si la table User existe et si elle est vide
    let count = 0;
    try {
      count = await prisma.user.count();
    } catch (error) {
      // Si la table n'existe pas, on doit d'abord exÃ©cuter les migrations Prisma
      console.error('[Migration] La table User n\'existe pas encore. Veuillez exÃ©cuter: npx prisma migrate dev');
      return {
        error: "La table User n'existe pas encore. Veuillez exÃ©cuter 'npx prisma migrate dev' ou 'npx prisma db push' pour crÃ©er les tables."
      };
    }

    // if (count > 1) {
    //   return { info: "La table user contient dÃ©jÃ  tous les utilisateurs Harp. Importation ignorÃ©e." };
    // }

    // RÃ©initialiser l'auto-increment seulement si la table existe et contient des donnÃ©es
    if (count > 0) {
      try {
        await prisma.$executeRaw`ALTER TABLE User AUTO_INCREMENT = 1`;
      } catch (error) {
        // Ignorer l'erreur si la table est vide ou si l'auto-increment ne peut pas Ãªtre modifiÃ©
        console.warn('[Migration] Impossible de rÃ©initialiser l\'auto-increment, continuation...');
      }
    }

    // VÃ©rifier d'abord si la table psadm_user contient des utilisateurs
    const psadmUserCount = await prisma.psadm_user.count();
    if (psadmUserCount === 0) {
      return { error: "La table psadm_user est vide. Aucun utilisateur Ã  migrer." };
    }

    console.log(`[Migration] Nombre d'utilisateurs dans User: ${count}, dans psadm_user: ${psadmUserCount}`);

    // RÃ©cupÃ©rer tous les utilisateurs de psadm_user avec une requÃªte SQL brute
    // pour gÃ©rer les dates invalides (0000-00-00) qui causent des erreurs Prisma
    const psadmUsersRaw = await prisma.$queryRaw<Array<{
      netid: string;
      unxid: string | null;
      oprid: string | null;
      nom: string | null;
      prenom: string | null;
      pkeyfile: string | null;
      lastlogin: string | null;
      email: string | null;
      mdp: string;
    }>>`
      SELECT
        netid,
        unxid,
        oprid,
        nom,
        prenom,
        pkeyfile,
        CASE
          WHEN lastlogin IS NULL
             OR lastlogin = '0000-00-00 00:00:00'
             OR lastlogin = '0000-00-00'
             OR DATE(lastlogin) = '0000-00-00'
          THEN NULL
          ELSE lastlogin
        END as lastlogin,
        email,
        mdp
      FROM psadm_user
    `;

    if (!psadmUsersRaw || psadmUsersRaw.length === 0) {
      return { error: "Aucun utilisateur trouvÃ© dans psadm_user aprÃ¨s la requÃªte SQL." };
    }

    // Convertir les dates string en Date et filtrer les valeurs invalides
    const usersToCreate = psadmUsersRaw.map(user => {
      // Convertir lastlogin de string Ã  Date si valide
      let lastloginDate: Date | null = null;
      if (user.lastlogin) {
        try {
          const date = new Date(user.lastlogin);
          // VÃ©rifier que la date est valide
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            lastloginDate = date;
          }
        } catch {
          // Si la conversion Ã©choue, garder null
          lastloginDate = null;
        }
      }

      return {
        netid: user.netid || '',
        unxid: user.unxid || null,
        oprid: user.oprid || null,
        name: user.nom && user.prenom
          ? `${user.nom} ${user.prenom}`.trim()
          : (user.nom || user.prenom || user.netid || ''),
        nom: user.nom || null,
        prenom: user.prenom || null,
        pkeyfile: user.pkeyfile || null,
        lastlogin: lastloginDate,
        email: user.email || null,
        password: user.mdp || null,
      };
    });

    // Filtrer les utilisateurs qui existent dÃ©jÃ  pour ne crÃ©er que ceux qui manquent
    // Cela permet de forcer l'import mÃªme si la table User n'est pas vide
    const existingNetIds = await prisma.user.findMany({
      select: { netid: true }
    });
    const existingNetIdsSet = new Set(existingNetIds.map(u => u.netid));

    const usersToCreateFiltered = usersToCreate.filter(user => !existingNetIdsSet.has(user.netid));

    if (usersToCreateFiltered.length === 0) {
      return { info: `Tous les utilisateurs (${usersToCreate.length}) existent dÃ©jÃ  dans la table User. Aucun nouvel utilisateur Ã  crÃ©er.` };
    }

    console.log(`[Migration] ${usersToCreateFiltered.length} utilisateur(s) manquant(s) sur ${usersToCreate.length} total. Tentative de crÃ©ation...`);

    // CrÃ©er uniquement les utilisateurs manquants
    const createdUsers = await prisma.user.createMany({
      data: usersToCreateFiltered,
      skipDuplicates: true // Ignore les doublons basÃ©s sur les champs uniques (netid)
    });

    console.log(`[Migration] ${createdUsers.count} utilisateur(s) crÃ©Ã©(s) avec succÃ¨s.`);

    if (createdUsers.count === 0) {
      return { info: "Aucun nouvel utilisateur crÃ©Ã©. Tous les utilisateurs existent dÃ©jÃ  dans la table User." };
    }

    return { success: `${createdUsers.count} utilisateur(s) migrÃ©(s) vers Prisma avec succÃ¨s !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la migration des utilisateurs vers Prisma.", "migrerLesUtilisateursNEW");
  }
}


// ... existing code ...

export const OLD_importerLesEnvInfos = async () => {
  try {
    // VÃ©rifier si la table est vide
    const count = await prisma.harpenvinfo.count();

    if (count > 0) {
      return { info: "La table harpenvinfo contient dÃ©jÃ  des donnÃ©es. Importation ignorÃ©e." };
    }

    // RÃ©initialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpenvinfo AUTO_INCREMENT = 1`;

    // RÃ©cupÃ©rer les donnÃ©es avec un JOIN entre envsharp et

    const results = await prisma.$queryRaw<any[]>`
      SELECT
        e.id as envId,
        i.datadt,
        i.modetp,
        i.modedt,
        i.refreshdt,
        i.lastcheckstatus,
        i.lastcheckdt,
        i.lastcheckmsg,
        i.datmaj,
        i.deploycbldt,
        i.userunx,
        i.pswd_ft_exploit
      FROM envsharp e
      JOIN psadm_envinfo i ON e.env = i.env
      ORDER BY e.id
    `;


    const importedData = await prisma.harpenvinfo.createMany({
      data: results.map((row: any) => ({
        envId: row.envId,
        datadt: row.datadt || new Date(),
       // modetp: row.modetp,
        modedt: row.modedt || new Date(),
        refreshdt: row.refreshdt || new Date(),
        lastcheckstatus: row.lastcheckstatus,
        lastcheckdt: row.lastcheckdt || new Date(),
        lastcheckmsg: row.lastcheckmsg,
        datmaj: row.datmaj || new Date(),
        deploycbldt: row.deploycbldt,
        userunx: row.userunx,
        pswd_ft_exploit: row.pswd_ft_exploit
      }))
    });

    return { success: `${importedData.count} informations d'environnements importÃ©es avec succÃ¨s !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des informations d'environnements", "importerLesEnvInfos");
  }
};


/**
 * Importe les informations d'environnement de psadm_envinfo vers harpenvinfo
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesEnvInfos = async () => {
  try {
    // IMPORTANT : en prod, certaines colonnes DateTime peuvent contenir des valeurs "0" / invalides (P2020).
    // On joint directement envsharp <-> psadm_envinfo en SQL et on convertit les "0" en NULL.
    type Row = {
      envId: number;
      datadt: Date | null;
      modetp: string | null;
      refreshdt: Date | null;
      lastcheckstatus: number | null;
      lastcheckdt: Date | null;
      lastcheckmsg: string | null;
      datmaj: Date | null;
      deploycbldt: string | null;
      userunx: string | null;
      pswd_ft_exploit: string | null;
    };

    const rawJoined = await prisma.$queryRaw<Row[]>`
      SELECT
        e.id AS envId,
        CASE WHEN i.datadt = 0 THEN NULL ELSE i.datadt END AS datadt,
        i.modetp AS modetp,
        CASE WHEN i.refreshdt = 0 THEN NULL ELSE i.refreshdt END AS refreshdt,
        i.lastcheckstatus AS lastcheckstatus,
        CASE WHEN i.lastcheckdt = 0 THEN NULL ELSE i.lastcheckdt END AS lastcheckdt,
        i.lastcheckmsg AS lastcheckmsg,
        i.datmaj AS datmaj,
        i.deploycbldt AS deploycbldt,
        i.userunx AS userunx,
        i.pswd_ft_exploit AS pswd_ft_exploit
      FROM envsharp e
      INNER JOIN psadm_envinfo i
        ON LOWER(TRIM(i.env)) = LOWER(TRIM(e.env))
    `;

    const allDataToImport = rawJoined.map((r) => ({
      envId: r.envId,
      datadt: r.datadt || new Date(),
      modetp: r.modetp,
      refreshdt: r.refreshdt || r.datmaj || new Date(),
      lastcheckstatus: r.lastcheckstatus,
      lastcheckdt: r.lastcheckdt || r.datmaj || new Date(),
      lastcheckmsg: r.lastcheckmsg,
      datmaj: r.datmaj || new Date(),
      deploycbldt: r.deploycbldt,
      userunx: r.userunx,
      pswd_ft_exploit: r.pswd_ft_exploit,
    }));

    if (allDataToImport.length === 0) {
      return { info: "Aucune information d'environnement trouvÃ©e Ã  importer (aucune jointure envsharp <-> psadm_envinfo)." };
    }

    // RÃ©cupÃ©rer les informations dÃ©jÃ  prÃ©sentes dans harpenvinfo
    const existingInfos = await prisma.harpenvinfo.findMany({
      select: {
        envId: true
      }
    });

    // CrÃ©er un Set des envIds existants pour une recherche rapide
    // ClÃ© unique: envId
    const existingEnvIdsSet = new Set(existingInfos.map(info => info.envId));

    // Filtrer uniquement les informations qui n'existent pas encore (delta)
    const infosToImport = allDataToImport.filter(data =>
      !existingEnvIdsSet.has(data.envId)
    );

    if (infosToImport.length === 0) {
      return {
        info: "Toutes les informations d'environnement sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allDataToImport.length,
          totalInHarpenvinfo: existingInfos.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingInfos.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvinfo AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles informations
    const importedData = await prisma.harpenvinfo.createMany({
      data: infosToImport,
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) information(s) d'environnement importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allDataToImport.length,
        totalInHarpenvinfo: existingInfos.length + importedData.count,
        imported: importedData.count,
        skipped: allDataToImport.length - infosToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des informations d'environnements", "importerOraInstances");
  }
};
// ... existing code ...



// select distinct e.oracle_sid from psadm_env e;
/**
 * Importe les instances Oracle distinctes de psadm_env vers harpinstance
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerOraInstances = async () => {
  try {
    // RÃ©cupÃ©rer toutes les instances Oracle distinctes
    const allResults = await prisma.$queryRaw<Array<{
      oracle_sid: string;
    }>>`
      SELECT DISTINCT
        oracle_sid
      FROM psadm_env
      WHERE oracle_sid IS NOT NULL
      ORDER BY oracle_sid
    `;

    if (allResults.length === 0) {
      return { info: "Aucune instance Oracle trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les instances dÃ©jÃ  prÃ©sentes dans harpinstance
    const existingInstances = await prisma.harpinstance.findMany({
      select: {
        oracle_sid: true
      }
    });

    // CrÃ©er un Set des instances existantes pour une recherche rapide
    // ClÃ© unique: oracle_sid
    const existingInstancesSet = new Set(existingInstances.map(inst => inst.oracle_sid));

    // Filtrer uniquement les instances qui n'existent pas encore (delta)
    const instancesToImport = allResults.filter(result =>
      !existingInstancesSet.has(result.oracle_sid)
    );

    if (instancesToImport.length === 0) {
      return {
        info: "Toutes les instances Oracle sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpinstance: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpinstance AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles instances
    const importedData = await prisma.harpinstance.createMany({
      data: instancesToImport.map(result => ({
        oracle_sid: result.oracle_sid
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpinstance: existingInstances.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - instancesToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des instances Oracle", "importerOraInstances");
  }
};


/**
 * Fonction historique hors pipeline GO LIVE.
 * Ne pas utiliser aprÃ¨s GO LIVE :
 * harpinstance.serverId ne doit plus Ãªtre recalculÃ© automatiquement depuis psadm*.
 */
export const updateInstanceServerIds = async () => {
  try {
    // VÃ©rifier si les tables nÃ©cessaires contiennent des donnÃ©es
    const countInstances = await prisma.harpinstance.count();
    if (countInstances === 0) {
      return { info: "La table harpinstance est vide. Veuillez d'abord importer les instances." };
    }

    const countServers = await prisma.harpserve.count();
    if (countServers === 0) {
      return { info: "La table harpserve est vide. Veuillez d'abord importer les serveurs." };
    }

    // RÃ©cupÃ©rer les relations entre instances et serveurs
    const relations = await prisma.$queryRaw`
      SELECT DISTINCT o.id as instanceId, h.id as serverId
      FROM harpinstance o
      JOIN psadm_env e ON o.oracle_sid = e.oracle_sid
      JOIN psadm_rolesrv s ON s.env = e.env
      JOIN harpserve h ON h.srv = s.srv
      ORDER BY o.id
    `;

    // Mettre Ã  jour chaque instance avec son serverId correspondant (sÃ©quentiellement pour Ã©viter les conflits de concurrence)
    for (const relation of relations as any[]) {
      await prisma.harpinstance.update({
        where: { id: relation.instanceId },
        data: { serverId: relation.serverId }
      });
    }

    return { success: `Les relations instance-serveur ont Ã©tÃ© mises Ã  jour avec succÃ¨s !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour des relations instance-serveur", "updateInstanceServerIds");
  }
};
// select * from psadm_rolesrv where env like '%HPR1';
/**
 * Importe les relations environnement-serveur de psadm_rolesrv vers harpenvserv
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesEnvServeurs = async () => {
  try {
    // psadm_rolesrv reste en lecture seule.
    // Le statut legacy (21 ou NULL) n'est pas rÃ©Ã©crit : la destination
    // reÃ§oit status null pour ne pas dÃ©pendre d'un id statutenv inexistant.

    // RÃ©cupÃ©rer toutes les donnÃ©es avec la requÃªte (MySQL peut renvoyer envid/serverid en minuscules)
    const rawResults = await prisma.$queryRaw<Array<{
      envId?: number;
      envid?: number;
      serverId?: number;
      serverid?: number;
      typsrv: string;
      status?: number;
    }>>`
      SELECT
        e.id as envId,
        s.id as serverId,
        TRIM(r.typsrv) as typsrv,
        r.status
      FROM envsharp e
      INNER JOIN psadm_rolesrv r ON LOWER(TRIM(e.env)) = LOWER(TRIM(r.env))
      INNER JOIN harpserve s ON LOWER(TRIM(s.srv)) = LOWER(TRIM(r.srv))
      ORDER BY e.env
    `;

    const allResults = rawResults.map((r) => ({
      envId: r.envId ?? r.envid ?? 0,
      serverId: r.serverId ?? r.serverid ?? 0,
      typsrv: r.typsrv ?? "",
      status: r.status ?? null,
    })).filter((r) => r.envId > 0 && r.serverId > 0);

    if (allResults.length === 0) {
      return { info: "Aucune relation environnement-serveur trouvÃ©e Ã  importer (vÃ©rifier que env dans envsharp et srv dans harpserve correspondent Ã  psadm_rolesrv)." };
    }

    // RÃ©cupÃ©rer les relations dÃ©jÃ  prÃ©sentes dans harpenvserv
    const existingRelations = await prisma.harpenvserv.findMany({
      select: {
        envId: true,
        serverId: true,
        typsrv: true
      }
    });

    // Si harpenvserv est vide (premier import), tout importer. Sinon delta.
    let relationsToImport: typeof allResults;
    if (existingRelations.length === 0) {
      relationsToImport = allResults;
    } else {
      const existingRelationsSet = new Set(
        existingRelations.map(rel => `${rel.envId}-${rel.serverId}-${rel.typsrv ?? ""}`)
      );
      relationsToImport = allResults.filter(result => {
        const key = `${result.envId}-${result.serverId}-${result.typsrv}`;
        return !existingRelationsSet.has(key);
      });
    }

    if (relationsToImport.length === 0) {
      return {
        info: "Toutes les relations environnement-serveur sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpenvserv: existingRelations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingRelations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvserv AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer (status Ã  null pour Ã©viter FK statutenv si les id 0/1/2 n'existent pas)
    const importedData = await prisma.harpenvserv.createMany({
      data: relationsToImport.map(result => ({
        envId: result.envId,
        serverId: result.serverId,
        typsrv: result.typsrv,
        status: null
      })),
      skipDuplicates: true
    });

    return {
      success: `${importedData.count} nouvelle(s) relation(s) environnement-serveur importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpenvserv: existingRelations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - relationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des relations environnement-serveur", "importerLesEnvServeurs");
  }
};

export const updateEnvsharpInstanceIds = async () => {
  try {
    // VÃ©rifier si les tables nÃ©cessaires contiennent des donnÃ©es
    const countEnvs = await prisma.envsharp.count();
    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    const countInstances = await prisma.harpinstance.count();
    if (countInstances === 0) {
      return { info: "La table harpinstance est vide. Veuillez d'abord importer les instances." };
    }

    // RÃ©cupÃ©rer les relations entre environnements et instances
    const relations = await prisma.$queryRaw`
      SELECT e.id, i.id as instanceId
      FROM psadm_env p, envsharp e, harpinstance i
      WHERE e.env = p.env
        AND p.oracle_sid = i.oracle_sid
      ORDER BY e.id
    `;

    // Mettre Ã  jour chaque environnement avec son instanceId correspondant (sÃ©quentiellement pour Ã©viter les conflits de concurrence)
    for (const relation of relations as any[]) {
      await prisma.envsharp.update({
        where: { id: relation.id },
        data: { instanceId: relation.instanceId }
      });
    }

    return { success: `Les relations environnement-instance ont Ã©tÃ© mises Ã  jour avec succÃ¨s !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour des relations environnement-instance", "updateEnvsharpInstanceIds");
  }
};


export const updateEnvsharpOrarelease = async () => {
  try {
    // VÃ©rifier si la table envsharp contient des donnÃ©es
    const countEnvs = await prisma.envsharp.count();

    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // RÃ©cupÃ©rer les relations entre envsharp et psadm_oracle
    const relations = await prisma.$queryRaw`
      SELECT e.id, o.orarelease
      FROM envsharp e
      JOIN psadm_oracle o ON e.aliasql = o.aliasql
      WHERE o.orarelease IS NOT NULL
    `;

    // Mettre Ã  jour chaque environnement avec son orarelease correspondant (sÃ©quentiellement pour Ã©viter les conflits de concurrence)
    let updateCount = 0;
    for (const relation of relations as any[]) {
      await prisma.envsharp.update({
        where: { id: relation.id },
        data: { orarelease: relation.orarelease }
      });
      updateCount++;
    }

    return { success: `${updateCount} environnements mis Ã  jour avec leur version Oracle !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise Ã  jour des versions Oracle dans ENVSHARP", "updateEnvsharpOrarelease");
  }
};



// ... existing code ...

/**
 * Importe les dispositions d'environnement de psadm_dispo vers harpenvdispo
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesEnvDispos = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es avec la requÃªte
    const allResults = await prisma.$queryRaw<Array<{
      envId: number;
      fromdate: Date | null;
      msg: string | null;
      statenvId: number | null;
    }>>`
      SELECT
        e.id as envId,
        CASE
          WHEN d.fromdate IS NULL
            OR d.fromdate = '0000-00-00 00:00:00'
            OR d.fromdate = '0000-00-00'
            OR DATE(d.fromdate) = '0000-00-00'
          THEN NULL
          ELSE d.fromdate
        END AS fromdate,
        d.msg,
        st.id AS statenvId
      FROM envsharp e
      INNER JOIN psadm_dispo d ON d.env = e.env
      LEFT JOIN statutenv st ON st.statenv = d.statenv
      ORDER BY e.env, d.fromdate DESC
    `;

    if (allResults.length === 0) {
      return { info: "Aucune disposition d'environnement trouvÃ©e Ã  importer." };
    }

    // Une date legacy invalide reste absente de la destination.
    // Elle n'est pas remplacÃ©e par NOW() et la source psadm_dispo n'est pas modifiÃ©e.
    const readableDispos = allResults.filter((result) => {
      if (!result.fromdate) {
        return false;
      }
      const parsed = new Date(result.fromdate);
      return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900;
    });
    const skippedInvalidDates = allResults.length - readableDispos.length;

    // RÃ©cupÃ©rer les dispositions dÃ©jÃ  prÃ©sentes dans harpenvdispo
    const existingDispos = await prisma.harpenvdispo.findMany({
      select: {
        envId: true,
        fromdate: true
      }
    });

    // CrÃ©er un Set des dispositions existantes pour une recherche rapide
    // ClÃ© unique: envId + fromdate
    const existingDisposSet = new Set(
      existingDispos.map(dispo => `${dispo.envId}-${dispo.fromdate.getTime()}`)
    );

    // Filtrer uniquement les dispositions qui n'existent pas encore (delta)
    const disposToImport = readableDispos.filter(result => {
      const key = `${result.envId}-${new Date(result.fromdate as Date).getTime()}`;
      return !existingDisposSet.has(key);
    });

    if (disposToImport.length === 0) {
      return {
        info: "Toutes les dispositions d'environnement sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpenvdispo: existingDispos.length,
          imported: 0,
          skippedInvalidDates
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingDispos.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvdispo AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles dispositions
    const importedData = await prisma.harpenvdispo.createMany({
      data: disposToImport.map(result => ({
        envId: result.envId,
        fromdate: result.fromdate as Date,
        msg: result.msg,
        statenvId: result.statenvId || 8 // Utilise 8 (OUVERT) comme valeur par dÃ©faut si statenvId est null
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) disposition(s) d'environnement importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpenvdispo: existingDispos.length + importedData.count,
        imported: importedData.count,
        skipped: readableDispos.length - disposToImport.length,
        skippedInvalidDates
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des dispositions d'environnements", "importerLesEnvDispos");
  }
};

/**
 * Forme de cmd enregistrÃ©e dans harptools : les guillemets legacy sont retirÃ©s.
 * L'identitÃ© logique doit utiliser exactement cette forme.
 */
function normalizeHarptoolCmd(cmd: string | null | undefined): string {
  return (cmd ?? "").replace(/"/g, "");
}

/**
 * IdentitÃ© logique d'un outil : commande normalisÃ©e, type et description.
 * La commande source et la commande dÃ©jÃ  stockÃ©e passent par la mÃªme normalisation.
 */
function harptoolIdentity(
  cmd: string | null | undefined,
  tooltype: string | null | undefined,
  descr: string | null | undefined
): string {
  return `${normalizeHarptoolCmd(cmd)}-${tooltype}-${descr}`;
}

/**
 * Importe les outils de psadm_tools vers harptools
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta).
 * Ne met pas Ã  jour et ne supprime pas les lignes dÃ©jÃ  prÃ©sentes.
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesTools = async () => {
  try {
    // RÃ©cupÃ©rer toutes les donnÃ©es de psadm_tools
    const allPsadmTools = await prisma.psadm_tools.findMany({
      orderBy: {
        descr: 'asc',
      },
    });

    if (allPsadmTools.length === 0) {
      return { info: "La table psadm_tools est vide. Aucune donnÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les outils dÃ©jÃ  prÃ©sents dans harptools
    const existingTools = await prisma.harptools.findMany({
      select: {
        cmd: true,
        tooltype: true,
        descr: true
      }
    });

    // Si la table harptools est vide, on importe TOUT psadm_tools (premier import).
    // Sinon, on ne prend que le delta basÃ© sur la commande normalisÃ©e + tooltype + descr.
    let toolsToImport: typeof allPsadmTools;
    if (existingTools.length === 0) {
      toolsToImport = allPsadmTools;
    } else {
      const existingToolsSet = new Set(
        existingTools.map(tool => harptoolIdentity(tool.cmd, tool.tooltype, tool.descr))
      );

      toolsToImport = allPsadmTools.filter(tool => {
        const key = harptoolIdentity(tool.cmd, tool.tooltype, tool.descr);
        return !existingToolsSet.has(key);
      });
    }

    if (toolsToImport.length === 0) {
      return {
        info: "Tous les outils sont dÃ©jÃ  importÃ©s. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allPsadmTools.length,
          totalInHarptools: existingTools.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingTools.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harptools AUTO_INCREMENT = 1`;
    }

    // Mapper les donnÃ©es de psadm_tools vers harptools et insÃ©rer uniquement les nouveaux outils
    const importedData = await prisma.harptools.createMany({
      data: toolsToImport.map((tool) => ({
        tool: tool.tool,           // identifiant logique (putty, sqlplus, ...)
        cmdpath: null,             // non gÃ©rÃ© pour l'instant
        cmd: normalizeHarptoolCmd(tool.cmd),
        version: null,
        descr: tool.descr,
        tooltype: tool.tooltype,
        cmdarg: tool.cmdarg || "",
        mode: tool.mode || "",
        output: tool.output || "",
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouveau(x) outil(s) importÃ©(s) avec succÃ¨s depuis psadm_tools vers harptools !`,
      details: {
        totalInSource: allPsadmTools.length,
        totalInHarptools: existingTools.length + importedData.count,
        imported: importedData.count,
        skipped: allPsadmTools.length - toolsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des outils depuis psadm_tools", "importerLesTools");
  }
};

/**
 * Importe les associations utilisateur-rÃ´le vers harpuseroles
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesUserRoles = async () => {
  try {
    // ExÃ©cuter la requÃªte SQL pour rÃ©cupÃ©rer toutes les associations user-role
    const allResults = await prisma.$queryRaw<Array<{
      userId: number;
      roleId: number;
    }>>`
      SELECT
        a.id as userId,
        e.id as roleId
      FROM User a, psadm_user b, psadm_typenv c, psadm_roleuser d, harproles e
      WHERE a.netid = b.netid
        AND a.netid = d.netid
        AND b.defpage = c.href
        AND d.role = e.role
      ORDER BY d.role
    `;

    if (allResults.length === 0) {
      return { info: "Aucune association utilisateur-rÃ´le trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les associations dÃ©jÃ  prÃ©sentes dans harpuseroles
    const existingAssociations = await prisma.harpuseroles.findMany({
      select: {
        userId: true,
        roleId: true
      }
    });

    // CrÃ©er un Set des associations existantes pour une recherche rapide
    // ClÃ© unique: userId + roleId (clÃ© primaire composite)
    const existingAssociationsSet = new Set(
      existingAssociations.map(assoc => `${assoc.userId}-${assoc.roleId}`)
    );

    // Filtrer uniquement les associations qui n'existent pas encore (delta)
    const associationsToImport = allResults.filter(result => {
      const key = `${result.userId}-${result.roleId}`;
      return !existingAssociationsSet.has(key);
    });

    if (associationsToImport.length === 0) {
      return {
        info: "Toutes les associations utilisateur-rÃ´le sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpuseroles: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpuseroles AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles associations
    const importedData = await prisma.harpuseroles.createMany({
      data: associationsToImport.map((row) => ({
        userId: row.userId,
        roleId: row.roleId,
        // datmaj sera automatiquement dÃ©fini par la valeur par dÃ©faut
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) association(s) utilisateur-rÃ´le importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpuseroles: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des associations utilisateur-rÃ´le", "importerLesUserRoles");
  }
};

/**
 * Importe les associations rÃ´le-menu vers harpmenurole
 * DÃ©tecte et importe uniquement les enregistrements manquants (delta)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesMenuRoles = async () => {
  try {
    // ExÃ©cuter la requÃªte SQL pour rÃ©cupÃ©rer toutes les associations role-menu
    const allResults = await prisma.$queryRaw<Array<{
      roleId: number;
      menuId: number;
      menu: string;
    }>>`
      SELECT
        e.id as roleId,
        f.id as menuId,
        f.menu
      FROM \`user\` a, psadm_user b, psadm_typenv c, psadm_roleuser d, harproles e, harpmenus f
      WHERE a.netid = b.netid
        AND a.netid = d.netid
        AND b.defpage = c.href
        AND d.role = e.role
        AND c.typenv = f.menu
      ORDER BY d.role
    `;

    if (allResults.length === 0) {
      return { info: "Aucune association rÃ´le-menu trouvÃ©e Ã  importer." };
    }

    // RÃ©cupÃ©rer les associations dÃ©jÃ  prÃ©sentes dans harpmenurole
    const existingAssociations = await prisma.harpmenurole.findMany({
      select: {
        roleId: true,
        menuId: true
      }
    });

    // CrÃ©er un Set des associations existantes pour une recherche rapide
    // ClÃ© unique: roleId + menuId (clÃ© primaire composite)
    const existingAssociationsSet = new Set(
      existingAssociations.map(assoc => `${assoc.roleId}-${assoc.menuId}`)
    );

    // Filtrer uniquement les associations qui n'existent pas encore (delta)
    const associationsToImport = allResults.filter(result => {
      const key = `${result.roleId}-${result.menuId}`;
      return !existingAssociationsSet.has(key);
    });

    if (associationsToImport.length === 0) {
      return {
        info: "Toutes les associations rÃ´le-menu sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpmenurole: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpmenurole AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles associations
    const importedData = await prisma.harpmenurole.createMany({
      data: associationsToImport.map((row) => ({
        roleId: row.roleId,
        menuId: row.menuId,
        // datmaj sera automatiquement dÃ©fini par la valeur par dÃ©faut
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) association(s) rÃ´le-menu importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpmenurole: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des associations rÃ´le-menu", "importerLesMenuRoles");
  }
};

/**
 * Taille d'une page lue sur la clÃ© primaire (env, monitordt).
 * 2 000 lignes restent nÃ©gligeables en mÃ©moire et permettent un parcours d'index.
 */
const MONITOR_PAGE_SIZE = 2000;

/**
 * Taille d'un createMany.
 * 500 lignes Ã— 15 colonnes = 7 500 paramÃ¨tres, trÃ¨s en dessous des limites
 * usuelles de paquets MySQL, tout en divisant par dix le nombre d'allers-retours
 * par rapport aux anciens lots de 50.
 */
const MONITOR_INSERT_BATCH_SIZE = 500;

const MONITOR_LOG_EVERY_PAGES = 50;

type MonitorInsertRow = {
  envId: number;
  monitordt: Date;
  dbstatus: number | null;
  nbdom: number | null;
  asstatus1: number | null;
  asstatus2: number | null;
  asstatus3: number | null;
  asstatus4: number | null;
  asstatus5: number | null;
  lastasdt: Date | null;
  prcsunxstatus: number | null;
  lastprcsunxdt: Date | null;
  prcsntstatus: number | null;
  lastprcsntdt: Date | null;
  lastlogin: string | null;
  lastlogindt: Date | null;
};

type MonitorCursor = {
  env: string;
  dt: string;
};

/**
 * ClÃ© logique envId + instant UTC tronquÃ© Ã  la seconde.
 * La mÃªme Date, Ã©crite puis relue par Prisma, produit la mÃªme clÃ©.
 */
function monitorLogicalKey(envId: number, monitordt: Date): string {
  const normalized = new Date(monitordt.getTime());
  normalized.setUTCMilliseconds(0);
  return `${envId}-${normalized.toISOString().slice(0, 19)}`;
}

/**
 * Sentinelles historiques, en UTC, indÃ©pendantes de l'horloge courante.
 * 1 = NULL, 2 = date zÃ©ro, 3 = autre date illisible.
 */
function sentinelMonitorDate(seconds: 1 | 2 | 3): Date {
  return new Date(Date.UTC(1970, 0, 1, 0, 0, seconds));
}

function monitorField(row: Record<string, unknown>, name: string): unknown {
  if (name in row) {
    return row[name];
  }
  return row[name.toLowerCase()];
}

function asMonitorInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asMonitorUnix(value: unknown): number | null {
  return asMonitorInt(value);
}

function asMonitorCursor(value: unknown): string {
  if (value instanceof Date) {
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  return String(value ?? "").trim();
}

/**
 * Date optionnelle dÃ©jÃ  filtrÃ©e en SQL. Une valeur illisible reste null.
 */
function parseOptionalMonitorDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  try {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      return date;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Instant de destination.
 * Les dates valides viennent de UNIX_TIMESTAMP, donc de l'instant UTC rÃ©el
 * du TIMESTAMP, pas d'une chaÃ®ne interprÃ©tÃ©e selon le fuseau.
 */
function destinationMonitorDate(kind: string, unixValue: number | null): Date {
  if (kind === "zero") {
    return sentinelMonitorDate(2);
  }
  if (kind === "null" || kind === "") {
    return sentinelMonitorDate(1);
  }
  if (unixValue === null) {
    return sentinelMonitorDate(3);
  }
  const date = new Date(unixValue * 1000);
  if (isNaN(date.getTime()) || date.getUTCFullYear() < 1970 || date.getUTCFullYear() > 2037) {
    return sentinelMonitorDate(3);
  }
  return date;
}

/**
 * Importe psadm_monitor vers harpmonitor par pages sur la clÃ© (env, monitordt).
 * psadm_monitor est lue uniquement. harpmonitor n'est jamais chargÃ©e en entier :
 * chaque lot ne relit que les clÃ©s susceptibles de collision.
 *
 * @returns SuccÃ¨s avec le nombre crÃ©Ã©, un info si tout est dÃ©jÃ  importÃ©,
 * ou error si une insertion Ã©choue. Les lignes dÃ©jÃ  Ã©crites sont conservÃ©es.
 */
export const importerLesMonitors = async () => {
  const ignoredEnvs = new Map<string, number>();
  let sourceLue = 0;
  let sourceJoignable = 0;
  let dejaPresents = 0;
  let crees = 0;
  let doublonsInternes = 0;
  let pagesTraitees = 0;

  const details = () => {
    const enregistrementsIgnores = Array.from(ignoredEnvs.values()).reduce((sum, count) => sum + count, 0);
    return {
      sourceLue,
      sourceJoignable,
      environnementsAbsents: ignoredEnvs.size,
      enregistrementsIgnores,
      dejaPresents,
      crees,
      doublonsInternes,
      pagesTraitees,
      ignoredEnvNames: Array.from(ignoredEnvs.keys()),
    };
  };

  const selectList = `
        env,
        DATE_FORMAT(monitordt, '%Y-%m-%d %H:%i:%s') AS cursordt,
        CASE
          WHEN monitordt IS NULL THEN 'null'
          WHEN monitordt = '0000-00-00 00:00:00'
            OR DATE(monitordt) = '0000-00-00' THEN 'zero'
          ELSE 'valid'
        END AS monitordtkind,
        CASE
          WHEN monitordt IS NULL
            OR monitordt = '0000-00-00 00:00:00'
            OR DATE(monitordt) = '0000-00-00'
          THEN NULL
          ELSE UNIX_TIMESTAMP(monitordt)
        END AS monitordtunix,
        dbstatus,
        nbdom,
        asstatus1,
        asstatus2,
        asstatus3,
        asstatus4,
        asstatus5,
        CASE
          WHEN lastasdt IS NULL
            OR lastasdt = '0000-00-00 00:00:00'
            OR DATE(lastasdt) = '0000-00-00'
          THEN NULL
          ELSE lastasdt
        END AS lastasdt,
        prcsunxstatus,
        CASE
          WHEN lastprcsunxdt IS NULL
            OR lastprcsunxdt = '0000-00-00 00:00:00'
            OR DATE(lastprcsunxdt) = '0000-00-00'
          THEN NULL
          ELSE lastprcsunxdt
        END AS lastprcsunxdt,
        prcsntstatus,
        CASE
          WHEN lastprcsntdt IS NULL
            OR lastprcsntdt = '0000-00-00 00:00:00'
            OR DATE(lastprcsntdt) = '0000-00-00'
          THEN NULL
          ELSE lastprcsntdt
        END AS lastprcsntdt,
        lastlogin,
        CASE
          WHEN lastlogindt IS NULL
            OR lastlogindt = '0000-00-00 00:00:00'
            OR DATE(lastlogindt) = '0000-00-00'
          THEN NULL
          ELSE lastlogindt
        END AS lastlogindt`;

  try {
    const countEnvs = await prisma.envsharp.count();
    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    const allEnvs = await prisma.envsharp.findMany({
      select: { id: true, env: true },
    });
    const envMap = new Map(allEnvs.map((env) => [env.env, env.id]));

    let cursor: MonitorCursor | null = null;

    for (;;) {
      const page = cursor
        ? await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
            `SELECT ${selectList}
             FROM psadm_monitor
             WHERE env > ? OR (env = ? AND monitordt > ?)
             ORDER BY env ASC, monitordt ASC
             LIMIT ${MONITOR_PAGE_SIZE}`,
            cursor.env,
            cursor.env,
            cursor.dt
          )
        : await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
            `SELECT ${selectList}
             FROM psadm_monitor
             ORDER BY env ASC, monitordt ASC
             LIMIT ${MONITOR_PAGE_SIZE}`
          );

      if (page.length === 0) {
        break;
      }

      pagesTraitees += 1;
      sourceLue += page.length;

      const lastRow = page[page.length - 1];
      const nextCursor: MonitorCursor = {
        env: String(monitorField(lastRow, "env") ?? "").trim(),
        dt: asMonitorCursor(monitorField(lastRow, "cursordt")),
      };
      if (!nextCursor.env || !nextCursor.dt) {
        return {
          error: "Import des monitors interrompu : curseur source illisible. Les lignes dÃ©jÃ  insÃ©rÃ©es sont conservÃ©es.",
          details: details(),
        };
      }
      if (cursor && cursor.env === nextCursor.env && cursor.dt === nextCursor.dt) {
        return {
          error: "Import des monitors interrompu : le curseur n'avance pas. Les lignes dÃ©jÃ  insÃ©rÃ©es sont conservÃ©es.",
          details: details(),
        };
      }

      const seenInPage = new Set<string>();
      const toInsert: MonitorInsertRow[] = [];

      for (const row of page) {
        const envName = String(monitorField(row, "env") ?? "");
        const envId = envMap.get(envName);
        if (!envId) {
          ignoredEnvs.set(envName, (ignoredEnvs.get(envName) ?? 0) + 1);
          continue;
        }

        sourceJoignable += 1;
        const kind = String(monitorField(row, "monitordtkind") ?? "").toLowerCase();
        const monitordt = destinationMonitorDate(kind, asMonitorUnix(monitorField(row, "monitordtunix")));
        const key = monitorLogicalKey(envId, monitordt);
        if (seenInPage.has(key)) {
          doublonsInternes += 1;
          continue;
        }
        seenInPage.add(key);

        const lastloginRaw = monitorField(row, "lastlogin");
        toInsert.push({
          envId,
          monitordt,
          dbstatus: asMonitorInt(monitorField(row, "dbstatus")),
          nbdom: asMonitorInt(monitorField(row, "nbdom")),
          asstatus1: asMonitorInt(monitorField(row, "asstatus1")),
          asstatus2: asMonitorInt(monitorField(row, "asstatus2")),
          asstatus3: asMonitorInt(monitorField(row, "asstatus3")),
          asstatus4: asMonitorInt(monitorField(row, "asstatus4")),
          asstatus5: asMonitorInt(monitorField(row, "asstatus5")),
          lastasdt: parseOptionalMonitorDate(monitorField(row, "lastasdt")),
          prcsunxstatus: asMonitorInt(monitorField(row, "prcsunxstatus")),
          lastprcsunxdt: parseOptionalMonitorDate(monitorField(row, "lastprcsunxdt")),
          prcsntstatus: asMonitorInt(monitorField(row, "prcsntstatus")),
          lastprcsntdt: parseOptionalMonitorDate(monitorField(row, "lastprcsntdt")),
          lastlogin: lastloginRaw === null || lastloginRaw === undefined ? null : String(lastloginRaw),
          lastlogindt: parseOptionalMonitorDate(monitorField(row, "lastlogindt")),
        });
      }

      for (let offset = 0; offset < toInsert.length; offset += MONITOR_INSERT_BATCH_SIZE) {
        const batch = toInsert.slice(offset, offset + MONITOR_INSERT_BATCH_SIZE);
        const existing = await prisma.harpmonitor.findMany({
          where: {
            OR: batch.map((row) => ({
              envId: row.envId,
              monitordt: row.monitordt,
            })),
          },
          select: { envId: true, monitordt: true },
        });
        const existingKeys = new Set(existing.map((row) => monitorLogicalKey(row.envId, row.monitordt)));
        const missing = batch.filter((row) => !existingKeys.has(monitorLogicalKey(row.envId, row.monitordt)));
        dejaPresents += batch.length - missing.length;

        if (missing.length === 0) {
          continue;
        }

        try {
          const inserted = await prisma.harpmonitor.createMany({ data: missing });
          if (inserted.count !== missing.length) {
            return {
              error: `Import des monitors interrompu : ${inserted.count} ligne(s) crÃ©Ã©e(s) sur ${missing.length} attendue(s). Les lignes dÃ©jÃ  insÃ©rÃ©es sont conservÃ©es. Relancer en mode reprise.`,
              details: { ...details(), crees: crees + inserted.count },
            };
          }
          crees += inserted.count;
        } catch (insertError) {
          const message = insertError instanceof Error ? insertError.message : String(insertError);
          console.error("[importerLesMonitors] Ã‰chec d'insertion:", insertError);
          return {
            error: `Import des monitors interrompu : ${message}. Les lignes dÃ©jÃ  insÃ©rÃ©es sont conservÃ©es. Relancer en mode reprise.`,
            details: details(),
          };
        }
      }

      cursor = nextCursor;

      if (pagesTraitees % MONITOR_LOG_EVERY_PAGES === 0) {
        console.log(`[importerLesMonitors] Page ${pagesTraitees} : ${sourceLue} lue(s), ${crees} crÃ©Ã©e(s), ${dejaPresents} dÃ©jÃ  prÃ©sente(s).`);
      }

      if (page.length < MONITOR_PAGE_SIZE) {
        break;
      }
    }

    if (ignoredEnvs.size > 0) {
      const ignoredCount = Array.from(ignoredEnvs.values()).reduce((sum, count) => sum + count, 0);
      console.warn(`[importerLesMonitors] ${ignoredEnvs.size} environnement(s) ignorÃ©(s), ${ignoredCount} ligne(s) : ${Array.from(ignoredEnvs.keys()).join(", ")}`);
    }

    if (sourceLue === 0) {
      return {
        info: "Aucune donnÃ©e de monitoring trouvÃ©e Ã  importer.",
        details: details(),
      };
    }

    if (crees === 0) {
      return {
        info: "Toutes les donnÃ©es de monitoring sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: details(),
      };
    }

    const ignoredCount = Array.from(ignoredEnvs.values()).reduce((sum, count) => sum + count, 0);
    let successMessage = `${crees} nouvelle(s) donnÃ©e(s) de monitoring importÃ©e(s) avec succÃ¨s !`;
    if (ignoredEnvs.size > 0) {
      successMessage += ` (${ignoredCount} enregistrement(s) ignorÃ©(s) pour ${ignoredEnvs.size} environnement(s) non trouvÃ©(s) dans envsharp)`;
    }

    return {
      success: successMessage,
      details: details(),
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des donnÃ©es de monitoring", "importerLesMonitors");
  }
};

/**
 * Importe les items rÃ©utilisables HARP dans la table harpitems
 * InsÃ¨re uniquement les items qui n'existent pas encore (basÃ© sur descr unique)
 *
 * @returns Un objet avec success/info/warning/error et les dÃ©tails de l'importation
 */
export const importerLesHarpItems = async () => {
  try {
    // Liste des items Ã  importer
    const itemsToImport = [
      'Sauvegardes des HARPFILE_entrant\\recus',
      'Fermeture TP PR1 HRMS / FSCM',
      'DÃ©sactivation des pages indisponibilitÃ©',
      'Activation des pages d indisponibilitÃ©',
      'SVG1 - HR/FS : Point de reprise 1 avec mise sur bandes',
      'RÃ©tention 1 an + restaurer DRP + synchro HARPFILE',
      'Arret applications  (Weblo GASSI GASSI AS PRCS)',
      'Patching Oracle',
      'Upgrade Nouveaux Ptools',
      'Bascule vers les nouveaux domaines ptools',
      'comptage cobol + sqr',
      'DÃ©ploiement des cobols application',
      'Redemarrage applications  (Weblo GASSI GASSI AS PRCS)',
      'Upgrade agent Autosys + tester Autosys apres modif de ladapter',
      'RecrÃ©ation des schÃ©mas Oracle AUTOPS',
      'Ouverture en mode restreint Finalisation pour tests technique',
      'Mise Ã  dispo ddaudit pour TMA + Compare Ddaudit',
      'Test EDI vers NetEntreprise via autosys',
      'Test de connexion via gate4',
      'Fermeture du mode restreint finalisation',
      'Restauration avec SVG1 - point de reprise 1',
      'Sauvegarde SVG2 HR/FS avec mise sur bandes',
      'Installation du BL de Production + P0',
      'Verification de la livraison BL de Production  + P0',
      'SÃ©curitÃ© Synchro portail',
      'Lancement Ddaudit et Mis Ã  dispo TMA + compare ddaudit post livraison (PAS ERGONOMIE)',
      'ArrÃªt et Relance avec purge des caches Production (Weblo GASSI GASSI AS PRCS)',
      'Lancement SVG2 (post contrÃ´le livraison BL + P0)',
      'Lancement plan de production Delta',
      'Lancement plan de production RT',
      'Lancement plan de production Init',
      'Lancement plan de production Finalsation',
      'Lancement plan de production Hors Paie',
      'Restauration avec SVG1 - Point de reprise 1',
      'Lancemzent RCTL',
      'ContrÃ´les fonctionnels DXC/Orange (Post Plan)',
      'Lancement GRD',
      'Point GO/NOGO 1 Post Upgrade Ptools',
      'Point GO/NOGO Tech/TMA',
      'Stat et Reorgonisation index',
      'lancement SVG2 blocage de refresh PP2',
      'lancement SVG1 Hebdomadaire avec mise sur bandes',
      'ArrÃªter environnement',
      'Arret de tous les environnements',
      'Refresh environnement',
      'Refresh environnement pour nouveau tools',
      'Refresh de MHP / BC1',
      'Import Psquery',
      'Lancement script $HARPSHELL/set_config_post_upgrade.ks',
      'Pipeline TMA Ligne 1 (CR1/CI1/CD1/CQ1) et ligne 2(CR2/CI2/CD2) : prÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'QLR : PrÃ©paration des domaines Ptools 8.61',
      'QLR : Upgrade PT8.61',
      'PP1 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'PP1 : Uprade PT861',
      'PP2 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61 - Change technique Nov 25',
      'PR1 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61 - Change technique Nov 25',
      'PP3 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'PP4 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'BC1 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'BC2 : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'RFP : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'MHP : PrÃ©paration anticipÃ©e des domaines Ptools 8.61',
      'Pipeline Ligne 2 : refresh CR1 sur CD2',
      'Pipeline Ligne 2 (CD2): Upgrade PT861',
      'Pipeline Ligne 2 : livraison BL Prod G3R10',
      'Pipeline ligne 1 : clonage de CD2 sur CQ1/CI2',
      'DRP : prÃ©paration anticipÃ©e des domaines PT861',
      'PP2 -> RFP : import PSQuery 8.61.13',
      'RFP/BC2 - faire backup de RFP/BC2 en 8.60',
      'RFP/BC2 - Upgrade Ptools 8.61.13 HR/FS + patching Oracle',
      'RFP/BC2 - HR-FS DÃ©ploiement des cobols application G3R10',
      'RFP/BC2 - faire backup de RFP/BC2 en 8.61',
      'RFP/BC2 - Livraison du BL G3R10 + P0',
      'PR1 - GO ORANGE',
      'PR1 - Sauvegardes des HARPFILE_entrant\recus',
      'PR1 - Fermeture TP PR1 HR/FS Activation des pages d\'indisponibilitÃ©',
      'PR1 - SVG1 - HR/FS : Point de reprise 1 avec mise sur bandes (1h15) - RÃ©tention 1 an + restaurer DRP + synchro HARPFILE',
      'PR1 - HR : Arret appli + Weblo',
      'PR1 - HR : Patching Oracle',
      'PR1 -FS : Arret appli + Weblo',
      'PR1 - FS : Patching Oracle',
      'PR1-HR : Upgrade Ptools 8.61.13',
      'PR1 - FS : Upgrade Ptools 8.61.13',
      'PR1 - HR-FS : bascule vers les domaines ptools 8.61.13',
      'PR1 - comptage cobol + sqr',
      'RFP - comptage cobol + sqr',
      'PR1 - HR-FS DÃ©ploiement des cobols application G3R10C00',
      'PR1 - HR/FS :Post Upgrade lancer le script de report du parametrage PRCS sur les bases Prod FS et HR => $HARPSHELL/set_config_post_upgrade.ks',
      'PR1 - HR : Redemarrage Appli + Weblo',
      'PR1 - FS : Redemarrage Appli + Weblo',
      'PR1 - Upgrade agent Autosys + tester Autosys apres modif de l\'adapter fr_fth_testglobal_psoft_pr1_b',
      'PR1 - DBA: RecrÃ©ation des schÃ©mas Oracle AUTOPS',
      'PR1 - Ouverture en mode "restreint Finalisation" pour tests technique (navigation, A DEFINIR ..) + test de connexion via gate4',
      'PR1 - Mise Ã  dispo ddaudit pour TMA + Compare Ddaudit',
      'PR1 : Test EDI vers NetEntreprise via autosys',
      'PR1 : Fermeture du mode "restreint finalisation"',
      'Point GO/NOGO 1 Post Upgrade Ptools 8.61.13',
      'Si GO => step SVG2',
      'Si NOGO 1 => Restauration avec SVG1 - point de reprise 1',
      'PR1 - Sauvegarde SVG2 HR/FS avec mise sur bandes - aprÃ¨s PT8.61.13 cas ou pb avec la livraison du BL',
      'PR1 - HR-FS - Installation du BL de Production G3R10C00 + P0',
      'PR1 - Verification de la livraison BL PRD G3R10C00 + P0',
      'PR1 - Synchro portail',
      'PR1 - Lancer Ddaudit + mettre Ã  dispo TMA + compare ddaudit post livraison (PAS ERGONOMIE)',
      'PR1 - Favoris via gate4, droit switch user pour PP2 PP3',
      'PR1 - A/R avec purge des caches Production AS et Weblo GASSI et non GASSI et PRCS',
      'Point GO/NOGO Tech/TMA (Post BL G3R10)',
      'PR1 - lancement SVG2 (post contrÃ´le livraison G3R10C00 + P0)',
      'Si Go => step Lancement du RT',
      'Si NOGO 2 => restauration avec SVG1 - Point de reprise 1',
      'Lancement plan type " Recalculer Tous" - ON_ICE SVG2 + PP2 + GRD + Boite DSN evenementielle',
      'PR1 : ContrÃ´les fonctionnels DXC/Orange (Post Plan)',
      'PR1 : Lancer la GRD 3',
      'Point GO/NOGO Tech/TMA (Post Plan)',
      'Si NOGO 3 => Restauration avec SVG1 - Point de reprise 1',
      'PR1 : Stat et Reorg index',
      'PR1 : lancement SVG2 (avec blocage de refresh PP2) + SVG1 Hebdomadaire - Avec mise sur bandes',
      'PP2 : ArrÃªter PP2',
      'PP2 : Bascule du domaines 8.61.13',
      'PP2 : Refresh de PP2',
      'PP2 : import Psquery en 8.61.13 de RFP -> PP2',
      'PP3 : Arreter PP3',
      'PP3 : bascule des domaines 8.61.13',
      'PP3 : refresh PP3',
      'PP4 : ArrÃªter PP4',
      'PP4 : bascule des domaines 8.61.13',
      'PP4 : refresh PP4',
      'MHP/BC1 : + bascule des domaines en 8.61.13',
      'MHP: Refresh de MHP/BC1',
      'Ligne 1 et 2 : patching Oracle (!! Arret de tous les environnements)',
      'Ligne 1 : bascule des domaines (CCN/CR1/CD1/CQ1/CI1)',
      'Ligne 1 : refresh 2K de la ligne 1 avec liste Production et CR2',
      'DRP : bascule des domaines 8.61.13',
      'DRP : refresh avec PR1 en PT861',
    ];

    // RÃ©cupÃ©rer les items dÃ©jÃ  prÃ©sents dans harpitems
    const existingItems = await prisma.harpitems.findMany({
      select: {
        descr: true
      }
    });

    // CrÃ©er un Set des descriptions existantes pour une recherche rapide
    const existingDescrSet = new Set(existingItems.map(item => item.descr));

    // Filtrer uniquement les items qui n'existent pas encore (delta)
    const itemsToInsert = itemsToImport.filter(descr => !existingDescrSet.has(descr));

    if (itemsToInsert.length === 0) {
      return {
        info: "Tous les items rÃ©utilisables sont dÃ©jÃ  importÃ©s. Aucun nouvel enregistrement Ã  importer.",
        details: {
          totalInSource: itemsToImport.length,
          totalInHarpitems: existingItems.length,
          imported: 0,
          skipped: itemsToImport.length
        }
      };
    }

    // InsÃ©rer uniquement les nouveaux items
    const result = await prisma.harpitems.createMany({
      data: itemsToInsert.map(descr => ({
        descr: descr
        // createdAt et updatedAt sont gÃ©rÃ©s automatiquement par Prisma
      })),
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${result.count} nouveau(x) item(s) rÃ©utilisable(s) importÃ©(s) avec succÃ¨s !`,
      details: {
        totalInSource: itemsToImport.length,
        totalInHarpitems: existingItems.length + result.count,
        imported: result.count,
        skipped: itemsToImport.length - itemsToInsert.length
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des items rÃ©utilisables HARP", "importerLesHarpItems");
  }
};


export const importerEnvServeursPUM = async () => {
  try {
    // Mettre Ã  jour les statuts avant l'import
    await prisma.$executeRaw`update psadm_rolesrv set status = 8 where status = 21`;
    await prisma.$executeRaw`update psadm_rolesrv set status = 8 where status is null`;

    // RÃ©cupÃ©rer toutes les donnÃ©es avec la requÃªte (MySQL peut renvoyer envid/serverid en minuscules)
    const rawResults = await prisma.$queryRaw<Array<{
      envId?: number;
      envid?: number;
      serverId?: number;
      serverid?: number;
      typsrv: string;
      status?: number;
    }>>`
      SELECT
        e.id as envId,
        e.typenvid,
        s.id as serverId,
        TRIM(r.typsrv) as typsrv,
        r.status
      FROM envsharp e
      INNER JOIN psadm_rolesrv r ON LOWER(TRIM(e.env)) = LOWER(TRIM(r.env))
      INNER JOIN harpserve s ON LOWER(TRIM(s.srv)) = LOWER(TRIM(r.srv))
      WHERE e.typenvid = 21
      ORDER BY e.env
    `;

    const allResults = rawResults.map((r) => ({
      envId: r.envId ?? r.envid ?? 0,
      serverId: r.serverId ?? r.serverid ?? 0,
      typsrv: r.typsrv ?? "",
      status: r.status ?? null,
    })).filter((r) => r.envId > 0 && r.serverId > 0);

    if (allResults.length === 0) {
      return { info: "Aucune relation environnement PUM-serveur trouvÃ©e Ã  importer (vÃ©rifier que env dans envsharp et srv dans harpserve correspondent Ã  psadm_rolesrv)." };
    }

    // RÃ©cupÃ©rer les relations dÃ©jÃ  prÃ©sentes dans harpenvserv
    const existingRelations = await prisma.harpenvserv.findMany({
      select: {
        envId: true,
        serverId: true,
        typsrv: true
      }
    });

    // Si harpenvserv est vide (premier import), tout importer. Sinon delta.
    let relationsToImport: typeof allResults;
    if (existingRelations.length === 0) {
      relationsToImport = allResults;
    } else {
      const existingRelationsSet = new Set(
        existingRelations.map(rel => `${rel.envId}-${rel.serverId}-${rel.typsrv ?? ""}`)
      );
      relationsToImport = allResults.filter(result => {
        const key = `${result.envId}-${result.serverId}-${result.typsrv}`;
        return !existingRelationsSet.has(key);
      });
    }

    if (relationsToImport.length === 0) {
      return {
        info: "Toutes les relations environnement PUM -serveur sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpenvserv: existingRelations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingRelations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvserv AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer (status Ã  null pour Ã©viter FK statutenv si les id 0/1/2 n'existent pas)
    const importedData = await prisma.harpenvserv.createMany({
      data: relationsToImport.map(result => ({
        envId: result.envId,
        serverId: result.serverId,
        typsrv: result.typsrv,
        status: null
      })),
      skipDuplicates: true
    });

    return {
      success: `${importedData.count} nouvelle(s) relation(s) environnement-serveur importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpenvserv: existingRelations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - relationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des relations environnement-serveur", "importerLesEnvServeurs");
  }
};



export const importerLesEnvPUMInfos = async () => {
  try {
    // IMPORTANT : en prod, certaines colonnes DateTime peuvent contenir des valeurs "0" / invalides (P2020).
    // On joint directement envsharp <-> psadm_envinfo en SQL et on convertit les "0" en NULL.
    type Row = {
      envId: number;
      datadt: Date | null;
      modetp: string | null;
      refreshdt: Date | null;
      lastcheckstatus: number | null;
      lastcheckdt: Date | null;
      lastcheckmsg: string | null;
      datmaj: Date | null;
      deploycbldt: string | null;
      userunx: string | null;
      pswd_ft_exploit: string | null;
    };

    const rawJoined = await prisma.$queryRaw<Row[]>`
      SELECT
        e.id AS envId,
        CASE WHEN i.datadt = 0 THEN NULL ELSE i.datadt END AS datadt,
        i.modetp AS modetp,
        CASE WHEN i.refreshdt = 0 THEN NULL ELSE i.refreshdt END AS refreshdt,
        i.lastcheckstatus AS lastcheckstatus,
        CASE WHEN i.lastcheckdt = 0 THEN NULL ELSE i.lastcheckdt END AS lastcheckdt,
        i.lastcheckmsg AS lastcheckmsg,
        i.datmaj AS datmaj,
        i.deploycbldt AS deploycbldt,
        i.userunx AS userunx,
        i.pswd_ft_exploit AS pswd_ft_exploit
      FROM envsharp e
      INNER JOIN psadm_envinfo i
        ON LOWER(TRIM(i.env)) = LOWER(TRIM(e.env))
      WHERE e.typenvid = 21
    `;

    const allDataToImport = rawJoined.map((r) => ({
      envId: r.envId,
      datadt: r.datadt || new Date(),
      modetp: r.modetp,
      refreshdt: r.refreshdt || r.datmaj || new Date(),
      lastcheckstatus: r.lastcheckstatus,
      lastcheckdt: r.lastcheckdt || r.datmaj || new Date(),
      lastcheckmsg: r.lastcheckmsg,
      datmaj: r.datmaj || new Date(),
      deploycbldt: r.deploycbldt,
      userunx: r.userunx,
      pswd_ft_exploit: r.pswd_ft_exploit,
    }));

    if (allDataToImport.length === 0) {
      return { info: "Aucune information d'environnement trouvÃ©e Ã  importer (aucune jointure envsharp <-> psadm_envinfo)." };
    }

    // RÃ©cupÃ©rer les informations dÃ©jÃ  prÃ©sentes dans harpenvinfo
    const existingInfos = await prisma.harpenvinfo.findMany({
      select: {
        envId: true
      }
    });

    // CrÃ©er un Set des envIds existants pour une recherche rapide
    // ClÃ© unique: envId
    const existingEnvIdsSet = new Set(existingInfos.map(info => info.envId));

    // Filtrer uniquement les informations qui n'existent pas encore (delta)
    const infosToImport = allDataToImport.filter(data =>
      !existingEnvIdsSet.has(data.envId)
    );

    if (infosToImport.length === 0) {
      return {
        info: "Toutes les informations d'environnement sont dÃ©jÃ  importÃ©es. Aucun nouveau enregistrement Ã  importer.",
        details: {
          totalInSource: allDataToImport.length,
          totalInHarpenvinfo: existingInfos.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), rÃ©initialiser l'auto-increment
    if (existingInfos.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvinfo AUTO_INCREMENT = 1`;
    }

    // InsÃ©rer uniquement les nouvelles informations
    const importedData = await prisma.harpenvinfo.createMany({
      data: infosToImport,
      skipDuplicates: true // SÃ©curitÃ© supplÃ©mentaire pour Ã©viter les doublons
    });

    return {
      success: `${importedData.count} nouvelle(s) information(s) d'environnement importÃ©e(s) avec succÃ¨s !`,
      details: {
        totalInSource: allDataToImport.length,
        totalInHarpenvinfo: existingInfos.length + importedData.count,
        imported: importedData.count,
        skipped: allDataToImport.length - infosToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des informations d'environnements", "importerOraInstances");
  }
};
