"use server";

import * as z from "zod";
import { toast } from "react-toastify";
import prisma  from "@/lib/prisma";

/**
 * Fonction utilitaire pour gérer les erreurs Prisma de manière cohérente
 * 
 * @param error - L'erreur capturée
 * @param defaultMessage - Message d'erreur par défaut si l'erreur n'est pas reconnue
 * @param context - Contexte supplémentaire pour le logging (nom de la fonction, etc.)
 * @returns Un objet avec error et details pour être retourné par les Server Actions
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

  // Gestion spécifique des erreurs Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code?: string; message?: string; meta?: unknown };
    
    // Erreur de connexion à la base de données
    if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
      return { 
        error: "Impossible de se connecter à la base de données. Veuillez vérifier que le serveur de base de données est accessible.",
        details: prismaError.message || "Erreur de connexion"
      };
    }
    
    // Autres erreurs Prisma
    return { 
      error: `${defaultMessage} (Erreur Prisma ${prismaError.code})`,
      details: prismaError.message || "Erreur de base de données"
    };
  }
  
  // Gestion des erreurs génériques
  return { 
    error: defaultMessage,
    details: error instanceof Error ? error.message : String(error) || "Erreur inconnue"
  };
}

export const insertTypeBases = async () => {
   try {
 
     // Vérifier si la table est vide
      const count = await prisma.harptypebase.count();
     
      if (count > 0) {
       // toast.info("La table statutenv contient déjà des données. Importation ignorée.");
        return { info: "La table harptypebase contient déjà des données. Insertion ignorée."};
      }
 
     // Réinitialiser l'auto-increment
     await prisma.$executeRaw`ALTER TABLE harptypebase AUTO_INCREMENT = 1`;
     
     // Création des statuts d'environnement
     await prisma.harptypebase.createMany({
       data: [
         { type_base: '2K', descr: 'Base 2K', icone: '' },
         { type_base: '4K', descr: 'Base 4K', icone: '' },
         { type_base: '150K', descr: 'Base 150K', icone: '' },
        ]
     });
 

    // toast.success("Les statuts d'environnements ont été chargésortés avec succès !") ;

     return { success: "Les stypes de bases ont été ajoutés avec succès !" };
   } catch (error) {
     return handlePrismaError(error, "HARP Erreur lors de l'ajout de type de bases", "insertTypeBases");
   }
    
 };

 export const importerLesStatus = async () => {
  try {

    // Vérifier si la table est vide
     const count = await prisma.statutenv.count();
    
     if (count > 0) {
      // toast.info("La table statutenv contient déjà des données. Importation ignorée.");
       return { info: "La table statutenv contient déjà des données. Importation ignorée."};
     }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpmenus AUTO_INCREMENT = 1`;
    
    // Création des statuts d'environnement
    await prisma.statutenv.createMany({
      data: [
        { statenv: 'ANONYMISE', descr: 'Données anonymisées', icone: 'anonym.png' },
        { statenv: 'BASE_ONLY', descr: 'Accès uniquement à la base de données', icone: 'base_only.png' },
        { statenv: 'DECOMMISSION', descr: 'Environnement à Décommissionner', icone: 'decommission.png' },
        { statenv: 'DUMMY', descr: 'Divers', icone: 'special.png' },
        { statenv: 'FERME', descr: 'Evironnement indisponible', icone: 'ferme.png' },
        { statenv: 'INVISIBLE', descr: 'Invisible', icone: 'invisible.png' },
        { statenv: 'OBSOLETE', descr: 'Environnement obsolète', icone: 'obsolete.png' },
        { statenv: 'OUVERT',  descr: 'Environnement disponible', icone: 'ouvert.png' },
        { statenv: 'REFRESH', descr: 'Environnement en cours de rafraichissement', icone: 'refresh.png' },
        { statenv: 'RESTREINT', descr: 'Accès reservé à certains utilisateurs', icone: 'restreint.png' }
      ]
    });

   // toast.success("Les statuts d'environnements ont été chargésortés avec succès !") ;

    return { success: "Les statuts d'environnement ont été importés avec succès !" };
  } catch (error) {
    return handlePrismaError(error, "HARP Erreur lors de l'importation des statuts d'environnement", "importerLesStatus");
  }
   
};


 export const updateDispoEnvIds = async () => {
  try {

      // Vérifier si la table est vide
      const countstatutenv = await prisma.statutenv.count();
    
      if (countstatutenv === 0) {
        return { info: "La table statutenv est vide. Veuillez d'abord importer les statuts." };
      }
     
      
    // Récupérer tous les statutenv
    const statutenvs = await prisma.statutenv.findMany();
    
    // Récupérer toutes les dispositions
    const dispositions = await prisma.psadm_dispo.findMany();
    
    // Traiter les mises à jour par lots pour éviter d'épuiser le pool de connexions
    const BATCH_SIZE = 50; // Traiter 50 mises à jour à la fois
    let updatedCount = 0;
    
    for (let i = 0; i < dispositions.length; i += BATCH_SIZE) {
      const batch = dispositions.slice(i, i + BATCH_SIZE);
      
      // Mettre à jour chaque disposition dans le lot (séquentiellement pour éviter les conflits de concurrence)
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
      
      // Petit délai entre les lots pour laisser le pool de connexions se récupérer
      if (i + BATCH_SIZE < dispositions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: `La mise à jour de statut d'environnements terminée avec succès ! ${updatedCount} disposition(s) mise(s) à jour.` };
        
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour du statut des environnements", "updateDispoEnvIds");
  }
}; 



 export const initDefaultValues = async () => {
  try {
      // Mise à jour de tous les environnements
      await prisma.psadm_env.updateMany({ data: { statenvId: 8 }  });

      // Mise à jour de tous les environnements
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
      

      return { success: "Mises à jour es valeur par defaut effectuées avec succès !" };
  } catch (error) {
      return handlePrismaError(error, "Erreur lors des mises à jour des valeur par defaut !", "initDefaultValues");
  }
};


export const GenererLesMenus = async () => {
  try {

    // Vérifier si la table est vide
    const count = await prisma.harpmenus.count();
     
    if (count > 0) {
     // toast.info("La table harpmenus contient déjà des données. Importation ignorée.");
      return { info: "La table harpmenus contient déjà des données. Importation ignorée." };
    } 

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpmenus AUTO_INCREMENT = 1`;

    // Insérer les données des menus
    await prisma.harpmenus.createMany({
      data: [
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
        { display: 0, level: 2, menu:  'Permissions par Rôle', href: '/list/permrole', descr: '', icone: 'localact.png',active:  1, role: 'TMA_LOCAL'},
        { display: 5, level: 1, menu:  'Recherche', href: '', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 7, level: 1, menu:  'Refresh Infos', href: '/refresh-info', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles', href: '/list/roles', descr: '', icone: '',active:  1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles serveurs', href: '/list/servrole', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles Utilisateurs', href: '/list/useroles', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 3, level: 1, menu:  'Self-service', href: '', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
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
      ]
    });

    return { success: "Tous les menus sont générés avec succès !" };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la génération des menus !", "GenererLesMenus");
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
      const result = await prisma.psadm_env.update({
        where: {
          typenv: update.typenv
        },
        data: {
          typenvid: {
            set: await prisma.psadm_typenv.findUnique({
              where: { typenv: update.typenv },
               select: { display: true }
            }).then(result => result?.display)
          }
        }
      });
    }

    return { success: "les environnements sont liés aux menux avec succès !"};
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour des environnements", "lierTypeEnvs");
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
  
      return { success: "Mise à jour des typenvid effectuée avec succès" };
    } catch (error) {
      return handlePrismaError(error, "Erreur lors de la mise à jour des typenvid", "lierEnvauTypeEnv");
    }
  };



export const importerLesHarproles = async () => {
  try {

    // Vérifier si la table est vide
    const count = await prisma.harproles.count();
    
    if (count > 0) {
      return { info: "La table harproles contient déjà des données. Importation ignorée." };
    }
    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harproles AUTO_INCREMENT = 1`;
    
    // Insérer les rôles
    await prisma.harproles.createMany({
      data: [
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
        { role: 'REFRESH_INFOS', descr: 'Mise à jour infos environnements' },
        { role: 'TMA_LOCAL', descr: 'Equipe TMA France' },
        { role: 'TMA_OFFSHORE', descr: 'Equipe TMA OFFSHORE' },
        { role: 'UPDSTATUS_DEV', descr: 'MAJ status environnements DEV' },
        { role: 'UPGRADE92', descr: 'Upgrade 9.2' }
      ]
    });

    return { success: "Rôles importés avec succès !" };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des rôles", "importerLesHarproles");
  }
};
 



/**
 * Importe les environnements de psadm_env vers envsharp
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export async function importListEnvs() {
  try {
    // Récupérer toutes les données de psadm_env
    // Note: env est la clé primaire, donc elle ne peut pas être null
    const envData = await prisma.psadm_env.findMany();

    if (!envData.length) {
      return { warning: "Aucune donnée trouvée dans psadm_env" };
    }

    // Récupérer les environnements déjà présents dans envsharp
    const existingEnvs = await prisma.envsharp.findMany({
      select: {
        env: true
      }
    });

    // Créer un Set des environnements existants pour une recherche rapide
    const existingEnvSet = new Set(existingEnvs.map(e => e.env));

    // Filtrer uniquement les environnements qui n'existent pas encore (delta)
    const envsToImport = envData.filter(record => !existingEnvSet.has(record.env));

    // Vérifier spécifiquement les environnements mentionnés par l'utilisateur
    const specificEnvs = ['FHFDMO','FHFPUM','FHFST1','FHFST2','FHFST3','FHHDMO','FHHPUM','FHHST1','FHHST2','FHHST3','FHXPUM'];
    const specificEnvsInSource = envData.filter(r => specificEnvs.includes(r.env));
    const specificEnvsInDestination = existingEnvs.filter(e => specificEnvs.includes(e.env));
    const specificEnvsToImport = envsToImport.filter(r => specificEnvs.includes(r.env));

    // Log pour debug
    console.log(`[importListEnvs] Environnements spécifiques - Source: ${specificEnvsInSource.length}, Destination: ${specificEnvsInDestination.length}, À importer: ${specificEnvsToImport.length}`);
    if (specificEnvsInSource.length > 0 && specificEnvsToImport.length === 0) {
      console.log(`[importListEnvs] ATTENTION: Les environnements spécifiques existent dans psadm_env mais sont déjà dans envsharp ou ne seront pas importés`);
      console.log(`[importListEnvs] Environnements dans psadm_env:`, specificEnvsInSource.map(e => e.env));
      console.log(`[importListEnvs] Environnements dans envsharp:`, specificEnvsInDestination.map(e => e.env));
    }

    if (envsToImport.length === 0) {
      return { 
        info: "Tous les environnements sont déjà importés. Aucun nouveau enregistrement à importer.",
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

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingEnvs.length === 0) {
      await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;
    }

    // Préparer les données à importer avec validation
    const dataToImport = envsToImport.map(record => {
      // Vérifier que les champs requis sont présents
      if (!record.env) {
        console.error(`[importListEnvs] Environnement sans nom (env) ignoré:`, record);
        return null;
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
        descr: record.descr || null, // Peut être null dans envsharp même si non-null dans psadm_env
        anonym: record.anonym || null,
        edi: record.edi || null,
        typenvid: record.typenvid || null,
        statenvId: record.statenvId || null
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Vérifier les environnements spécifiques dans les données à importer
    const specificEnvsInDataToImport = dataToImport.filter(d => specificEnvs.includes(d.env));
    if (specificEnvsInDataToImport.length > 0) {
      console.log(`[importListEnvs] Environnements spécifiques à importer:`, specificEnvsInDataToImport.map(e => e.env));
    }

    // Insérer uniquement les nouveaux enregistrements
    const result = await prisma.envsharp.createMany({
      data: dataToImport,
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    // Vérifier si les environnements spécifiques ont été importés
    // Note: On ne peut pas vérifier directement avec createMany, mais on sait qu'ils étaient dans dataToImport
    const specificEnvsImportedCount = specificEnvsInDataToImport.length;
    
    if (specificEnvsInDataToImport.length > 0) {
      console.log(`[importListEnvs] ${specificEnvsImportedCount} environnement(s) spécifique(s) dans les données à importer`);
    }

    return { 
      success: `${result.count} nouveau(x) environnement(s) Harp importé(s) avec succès !`,
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
 * Force l'import de certains environnements spécifiques depuis psadm_env vers envsharp
 * Cette fonction supprime d'abord les environnements existants puis les réimporte
 * 
 * IMPORTANT: Il faut absolument exécuter lierTypeEnvs() avant cette fonction pour remplir
 * le champ typenvid dans psadm_env, sinon les imports échoueront avec une erreur de contrainte
 * de clé étrangère.
 * 
 * @param envNames - Tableau des noms d'environnements à forcer (optionnel, utilise la liste par défaut si non fourni)
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export async function forceImportSpecificEnvs(envNames?: string[]) {
  try {
    // Liste par défaut des environnements à forcer
    const specificEnvs = envNames || ['FHFDMO','FHFPUM','FHFST1','FHFST2','FHFST3','FHHDMO','FHHPUM','FHHST1','FHHST2','FHHST3','FHXPUM'];
    
    console.log(`[forceImportSpecificEnvs] Début de l'import forcé pour ${specificEnvs.length} environnement(s):`, specificEnvs);

    // Récupérer les données de ces environnements depuis psadm_env
    const envData = await prisma.psadm_env.findMany({
      where: {
        env: {
          in: specificEnvs
        }
      }
    });

    if (envData.length === 0) {
      return { 
        warning: "Aucun des environnements spécifiés n'a été trouvé dans psadm_env",
        details: {
          requested: specificEnvs.length,
          found: 0,
          imported: 0
        }
      };
    }

    console.log(`[forceImportSpecificEnvs] ${envData.length} environnement(s) trouvé(s) dans psadm_env:`, envData.map(e => e.env));

    // Vérifier quels environnements existent déjà dans envsharp
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

    // Supprimer les environnements existants pour forcer la réimportation
    let deletedCount = 0;
    if (existingEnvNames.length > 0) {
      const deleteResult = await prisma.envsharp.deleteMany({
        where: {
          env: {
            in: existingEnvNames
          }
        }
      });
      deletedCount = deleteResult.count;
      console.log(`[forceImportSpecificEnvs] ${deletedCount} environnement(s) supprimé(s) de envsharp`);
    }

    // Récupérer tous les typenvid valides depuis harptypenv pour vérifier les contraintes de clé étrangère
    const validTypenvIds = await prisma.harptypenv.findMany({
      select: { id: true }
    });
    const validTypenvIdSet = new Set(validTypenvIds.map(t => t.id));
    console.log(`[forceImportSpecificEnvs] ${validTypenvIdSet.size} typenvid valide(s) trouvé(s) dans harptypenv`);

    // Préparer les données à importer
    // Note: typenvid doit être rempli dans psadm_env par lierTypeEnvs() avant d'appeler cette fonction
    const dataToImport = envData.map(record => {
      if (!record.env) {
        console.error(`[forceImportSpecificEnvs] Environnement sans nom (env) ignoré:`, record);
        return null;
      }

      // Vérifier que le typenvid existe dans harptypenv, sinon le mettre à null
      let typenvid: number | null = record.typenvid || null;
      if (typenvid !== null && !validTypenvIdSet.has(typenvid)) {
        console.warn(`[forceImportSpecificEnvs] typenvid ${typenvid} pour l'environnement ${record.env} n'existe pas dans harptypenv. Mise à null.`);
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
        typenvid: typenvid, // Vérifié et validé contre harptypenv
        statenvId: record.statenvId || null
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    console.log(`[forceImportSpecificEnvs] ${dataToImport.length} environnement(s) préparé(s) pour l'import`);
    if (dataToImport.length > 0) {
      console.log(`[forceImportSpecificEnvs] Exemple de données à importer:`, JSON.stringify(dataToImport[0], null, 2));
    }

    // Insérer les environnements un par un pour mieux identifier les erreurs
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

    console.log(`[forceImportSpecificEnvs] ${importedCount} environnement(s) importé(s) avec succès`);
    if (errors.length > 0) {
      console.error(`[forceImportSpecificEnvs] ${errors.length} erreur(s) lors de l'import:`, errors);
    }

    if (importedCount === 0 && errors.length > 0) {
      return {
        error: `Aucun environnement n'a pu être importé. ${errors.length} erreur(s) rencontrée(s).`,
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
        warning: `${importedCount} environnement(s) importé(s) sur ${dataToImport.length} (${errors.length} erreur(s))`,
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
      success: `${importedCount} environnement(s) spécifique(s) importé(s) avec succès (${deletedCount} supprimé(s) puis réimporté(s)) !`,
      details: {
        requested: specificEnvs.length,
        foundInSource: envData.length,
        deleted: deletedCount,
        imported: importedCount,
        environments: envData.map(e => e.env)
      }
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'import forcé des environnements spécifiques", "forceImportSpecificEnvs");
  }
}



/**
 * Importe les instances Oracle de psadm_oracle vers harpora
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importInstanceOra = async () => {
  try {
    // Vérifier si la table envsharp contient des données
    const countEnvsharp = await prisma.envsharp.count();
    
    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // Récupérer toutes les données avec un JOIN entre envsharp et psadm_oracle
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
      return { info: "Aucune instance Oracle trouvée à importer." };
    }

    // Récupérer les instances déjà présentes dans harpora
    const existingInstances = await prisma.harpora.findMany({
      select: {
        envId: true,
        oracle_sid: true,
        aliasql: true,
        oraschema: true
      }
    });

    // Créer un Set des instances existantes pour une recherche rapide
    // Clé unique: envId + oracle_sid + aliasql + oraschema
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
        info: "Toutes les instances Oracle sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allInstances.length,
          totalInHarpora: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles instances
    const importedData = await prisma.harpora.createMany({
      data: instancesToImport.map(instance => ({
        envId: instance.envId,
        oracle_sid: instance.oracle_sid,
        aliasql: instance.aliasql,
        oraschema: instance.oraschema,
        descr: instance.descr,
        orarelease: instance.orarelease
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importée(s) avec succès !`,
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
//     // Vérifier si la table est vide
//     const count = await prisma.envsharp.count();
   
//     if (count > 0) {
//       return { info: "La table envsharp contient déjà tous les environnements Harp. Importation ignorée." };
//     }

//     // Réinitialiser l'auto-increment
//     await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

//     // Récupérer les données de psadm_env
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
    
//     // Insérer les données dans envsharp
//     const result = await prisma.envsharp.createMany({
//       data: envData
//     });

//     return { success: `${result.count} environnements Harp importés avec succès !` };
//   } catch (error) {
//     console.error("Erreur lors de l'importation des environnements Harp:", error);
//     return { error: "Erreur lors de l'importation des environnements Harp" };
//   }
// }

 

/**
 * Importe les instances Oracle de psadm_oracle vers harpora (version alternative)
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerInstancesOracle = async () => {
  try {
    // Vérifier si la table envsharp contient des données
    const countEnvsharp = await prisma.envsharp.count();
    
    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // Récupérer toutes les données depuis les tables existantes
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
      return { info: "Aucune instance Oracle trouvée à importer." };
    }

    // Récupérer les instances déjà présentes dans harpora
    const existingInstances = await prisma.harpora.findMany({
      select: {
        envId: true,
        oracle_sid: true,
        aliasql: true,
        oraschema: true
      }
    });

    // Créer un Set des instances existantes pour une recherche rapide
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
        info: "Toutes les instances Oracle sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpora: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles instances
    const importedData = await prisma.harpora.createMany({
      data: instancesToImport.map(result => ({
        envId: result.envId,
        oracle_sid: result.oracle_sid,
        aliasql: result.aliasql,
        oraschema: result.oraschema,
        descr: result.descr,
        orarelease: result.orarelease
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importée(s) avec succès !`,
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
     // Vérifier si la table psadm_user contient des utilisateurs
     const psadmUserCount = await prisma.psadm_user.count();
     
     if (psadmUserCount === 0) {
       return { error: "La table psadm_user est vide. Aucun utilisateur à migrer." };
     }

     // Vérifier le nombre d'utilisateurs dans la table User
     const userCount = await prisma.user.count();
     console.log(`[Migration] Nombre d'utilisateurs dans User: ${userCount}, dans psadm_user: ${psadmUserCount}`);
    
     // FORCER l'import de tous les utilisateurs manquants, même si la table User n'est pas vide
     // La table User contient les authentifications, donc on doit toujours synchroniser avec psadm_user

     // Récupérer tous les utilisateurs de psadm_user
    const psadmUsers = await prisma.psadm_user.findMany()
    
    if (psadmUsers.length === 0) {
      return { error: "Aucun utilisateur trouvé dans psadm_user." };
    }

    console.log(`[Migration] Début de la migration de ${psadmUsers.length} utilisateurs...`)

    let importedCount = 0;
    let skippedCount = 0;

    // Pour chaque utilisateur dans psadm_user
    for (const user of psadmUsers) {
      // Vérifier si l'utilisateur existe déjà dans la table User
      const existingUser = await prisma.user.findUnique({
        where: { netid: user.netid }
      })

      if (!existingUser) {
        try {
          // Créer le nouvel utilisateur dans la table User
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
          console.log(`[Migration] Utilisateur migré avec succès: ${user.netid}`)
        } catch (createError) {
          console.error(`[Migration] Erreur lors de la création de l'utilisateur ${user.netid}:`, createError);
          // Continuer avec les autres utilisateurs
        }
      } else {
        skippedCount++;
        console.log(`[Migration] L'utilisateur ${user.netid} existe déjà, ignoré.`)
      }
    }
   
    // Toujours retourner un message, même si aucun utilisateur n'a été importé
    // Cela permet de forcer l'import même si la table User n'est pas vide
    if (importedCount === 0 && skippedCount > 0) {
      return { info: `Synchronisation terminée : Tous les utilisateurs (${skippedCount}) existent déjà dans la table User. Aucun nouvel utilisateur à importer.` };
    }

    return { success: `${importedCount} utilisateur(s) importé(s) avec succès ! ${skippedCount > 0 ? `(${skippedCount} déjà existant(s), ignoré(s))` : ''}` };
  } catch (error) {
    console.error("[Migration] Erreur lors de la migration des utilisateurs:", error);
    return handlePrismaError(error, "Erreur lors de la migration des utilisateurs vers Prisma.", "migrerLesUtilisateurs");
  } finally {
    // Ne pas déconnecter ici car cela peut causer des problèmes avec d'autres opérations
    // await prisma.$disconnect()
  }
};
 
/**
 * Migre les rôles utilisateurs de psadm_roleuser vers harpuseroles
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const migrerLesRolesUtilisateurs = async () => {
  try {
    // Vérifier si la table user est vide
    const countuser = await prisma.user.count();
    
    if (countuser === 0) {
      return { info: "La table user est vide. Vous devez d'abord importer les utilisateurs. Importation ignorée." };
    }

    // Récupérer toutes les données avec la requête fournie
    const allResults = await prisma.$queryRaw<Array<{
      userid: number;
      roleid: number;
      datmaj: Date | null;
    }>>`
      SELECT u.id as userid, h.id as roleid, pr.datmaj 
      FROM User u, psadm_roleuser pr, harproles h  
      WHERE u.netid = pr.netid AND h.role = pr.role
    `;

    if (allResults.length === 0) {
      return { info: "Aucune association utilisateur-rôle trouvée à importer." };
    }

    // Récupérer les associations déjà présentes dans harpuseroles
    const existingAssociations = await prisma.harpuseroles.findMany({
      select: {
        userId: true,
        roleId: true
      }
    });

    // Créer un Set des associations existantes pour une recherche rapide
    // Clé unique: userId + roleId (clé primaire composite)
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
        info: "Toutes les associations utilisateur-rôle sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpuseroles: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpuseroles AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles associations
    const importedData = await prisma.harpuseroles.createMany({
      data: associationsToImport.map(result => ({
        userId: result.userid,
        roleId: result.roleid,
        datmaj: result.datmaj || new Date()
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) association(s) utilisateur-rôle migrée(s) avec succès !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpuseroles: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la migration des rôles utilisateurs", "migrerLesRolesUtilisateurs");
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
      return { success: "Aucun doublon trouvé sur oracle_sid" };
    }

    // Récupérer les détails des enregistrements en doublon
    const detailsDoublons = await Promise.all(
      doublons.map(async (doublon) => {
        const instances = await prisma.harpora.findMany({
          where: {
            oracle_sid: doublon.oracle_sid
          },
          include: {
            envsharp: {
              select: {
                env: true
              }
            }
          }
        });

        return {
          oracle_sid: doublon.oracle_sid,
          occurrences: doublon._count.oracle_sid,
          environnements: instances.map(inst => ({
            id: inst.id,
            env: inst.envsharp.env,
            aliasql: inst.aliasql,
            oraschema: inst.oraschema
          }))
        };
      })
    );

    return { 
      warning: "Doublons trouvés sur oracle_sid",
      details: detailsDoublons
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la vérification des doublons sur oracle_sid", "verifierDoublonsOracleSid1");
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
      return { success: "Aucun doublon trouvé sur oracle_sid" };
    }

    // Récupérer les détails des enregistrements en doublon
    const detailsDoublons = await Promise.all(
      doublons.map(async (doublon) => {
        const instances = await prisma.harpora.findMany({
          where: {
            oracle_sid: doublon.oracle_sid
          },
          include: {
            envsharp: {
              select: {
                env: true
              }
            }
          },
          orderBy: {
            id: 'asc'
          }
        });

        return {
          oracle_sid: doublon.oracle_sid,
          occurrences: doublon._count.oracle_sid,
          environnements: instances.map(inst => ({
            id: inst.id,
            env: inst.envsharp.env,
            aliasql: inst.aliasql,
            oraschema: inst.oraschema
          }))
        };
      })
    );

    return { 
      warning: `${doublons.length} doublons trouvés sur oracle_sid`,
      details: detailsDoublons
    };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la vérification des doublons sur oracle_sid", "verifierDoublonsOracleSid");
  }
};

 

/**
 * Importe les versions PeopleSoft de psadm_version vers psoftversion
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesPsoftVersions = async () => {
  try {
    // Récupérer toutes les données de psadm_version
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
      return { info: "Aucune version PeopleSoft trouvée à importer." };
    }

    // Récupérer les versions déjà présentes dans psoftversion
    const existingVersions = await prisma.psoftversion.findMany({
      select: {
        psversion: true,
        ptversion: true,
        harprelease: true
      }
    });

    // Créer un Set des versions existantes pour une recherche rapide
    // Clé unique: psversion + ptversion + harprelease
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
        info: "Toutes les versions PeopleSoft sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allVersions.length,
          totalInPsoftversion: existingVersions.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingVersions.length === 0) {
      await prisma.$executeRaw`ALTER TABLE psoftversion AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles versions
    const result = await prisma.psoftversion.createMany({
      data: versionsToImport.map(version => ({
        psversion: version.psversion,
        ptversion: version.ptversion,
        harprelease: version.harprelease,
        descr: version.descr
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${result.count} nouvelle(s) version(s) PeopleSoft importée(s) avec succès !`,
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
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesPToolsVersions = async () => {
  try {
    // Récupérer toutes les données de psadm_ptools
    const allVersions = await prisma.$queryRaw<Array<{
      ptversion: string;
      descr: string | null;
    }>>`
      SELECT ptversion, descr 
      FROM psadm_ptools
    `;

    if (allVersions.length === 0) {
      return { info: "Aucune version PeopleTools trouvée à importer." };
    }

    // Récupérer les versions déjà présentes dans ptoolsversion
    const existingVersions = await prisma.ptoolsversion.findMany({
      select: {
        ptversion: true
      }
    });

    // Créer un Set des versions existantes pour une recherche rapide
    // Clé unique: ptversion
    const existingVersionsSet = new Set(existingVersions.map(ver => ver.ptversion));

    // Filtrer uniquement les versions qui n'existent pas encore (delta)
    const versionsToImport = allVersions.filter(version => 
      !existingVersionsSet.has(version.ptversion)
    );

    if (versionsToImport.length === 0) {
      return { 
        info: "Toutes les versions PeopleTools sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allVersions.length,
          totalInPtoolsversion: existingVersions.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingVersions.length === 0) {
      await prisma.$executeRaw`ALTER TABLE ptoolsversion AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles versions
    const result = await prisma.ptoolsversion.createMany({
      data: versionsToImport.map(version => ({
        ptversion: version.ptversion,
        descr: version.descr
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${result.count} nouvelle(s) version(s) PeopleTools importée(s) avec succès !`,
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
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const migrateReleaseData = async () => {
  try {
    // Récupérer toutes les données source
    const allReleases = await prisma.psadm_release.findMany({
      select: {
        harprelease: true,
        descr: true,
      },
    });

    if (allReleases.length === 0) {
      return { info: "Aucune donnée à migrer depuis psadm_release." };
    }

    // Récupérer les releases déjà présentes dans releaseenv
    const existingReleases = await prisma.releaseenv.findMany({
      select: {
        harprelease: true
      }
    });

    // Créer un Set des releases existantes pour une recherche rapide
    // Clé unique: harprelease
    const existingReleasesSet = new Set(existingReleases.map(rel => rel.harprelease));

    // Filtrer uniquement les releases qui n'existent pas encore (delta)
    const releasesToImport = allReleases.filter(release => 
      !existingReleasesSet.has(release.harprelease)
    );

    if (releasesToImport.length === 0) {
      return { 
        info: "Toutes les versions Harp sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allReleases.length,
          totalInReleaseenv: existingReleases.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingReleases.length === 0) {
      await prisma.$executeRaw`ALTER TABLE releaseenv AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles releases
    const result = await prisma.releaseenv.createMany({
      data: releasesToImport.map(release => ({
        harprelease: release.harprelease,
        descr: release.descr,
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `Migration réussie : ${result.count} nouvelle(s) version(s) Harp migrée(s) avec succès !`,
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
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesTypesEnv = async () => {
  try {
    // Récupérer toutes les données de psadm_typenv
    const allTypenvData = await prisma.psadm_typenv.findMany({
      select: {
        display: true,
        typenv: true,
        descr: true
      }
    });

    if (allTypenvData.length === 0) {
      return { info: "Aucun type d'environnement trouvé à importer." };
    }

    // Récupérer les types d'environnement déjà présents dans harptypenv
    const existingTypenvs = await prisma.harptypenv.findMany({
      select: {
        typenv: true
      }
    });

    // Créer un Set des types d'environnement existants pour une recherche rapide
    // Clé unique: typenv
    const existingTypenvsSet = new Set(existingTypenvs.map(te => te.typenv));

    // Filtrer uniquement les types d'environnement qui n'existent pas encore (delta)
    const typenvsToImport = allTypenvData.filter(record => 
      !existingTypenvsSet.has(record.typenv)
    );

    if (typenvsToImport.length === 0) {
      return { 
        info: "Tous les types d'environnement sont déjà importés. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allTypenvData.length,
          totalInHarptypenv: existingTypenvs.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingTypenvs.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harptypenv AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouveaux types d'environnement
    const result = await prisma.harptypenv.createMany({
      data: typenvsToImport.map(record => ({
        typenv: record.typenv,
        href: `/list/envs/${record.display}`,  // Génération du href basé sur display
        descr: record.descr
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${result.count} nouveau(x) type(s) d'environnement importé(s) avec succès !`,
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

     // Vérifier si la table releaseenv contient des données
     const countEnvs = await prisma.envsharp.count();
    
     if (countEnvs === 0) {
       return { info: "La table envsharp est vide. Veuillez d'abord importer les environements." };
     }
    // Vérifier si la table releaseenv contient des données
    const countReleases = await prisma.releaseenv.count();
    
    if (countReleases === 0) {
      return { info: "La table releaseenv est vide. Veuillez d'abord importer les releases." };
    }

    // Récupérer tous les environnements et leurs releases
    const envs = await prisma.envsharp.findMany();
    const releases = await prisma.releaseenv.findMany();

    // Mettre à jour chaque environnement (séquentiellement pour éviter les conflits de concurrence)
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

    return { success: `${updateCount} environnements mis à jour avec leur releaseId !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour des releaseId de ENVSHARP", "updateReleaseEnvIds");
  }
};

/**
 * Migre les serveurs de psadm_srv vers harpserve
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const migrateServers = async () => {
  try {
    // Récupérer toutes les données de psadm_srv
    const allPsadmSrvData = await prisma.psadm_srv.findMany();

    if (allPsadmSrvData.length === 0) {
      return { info: "La table psadm_srv est vide." };
    }

    // Récupérer les serveurs déjà présents dans harpserve
    const existingServers = await prisma.harpserve.findMany({
      select: {
        srv: true
      }
    });

    // Créer un Set des serveurs existants pour une recherche rapide
    // Clé unique: srv
    const existingServersSet = new Set(existingServers.map(srv => srv.srv));

    // Filtrer uniquement les serveurs qui n'existent pas encore (delta)
    const serversToImport = allPsadmSrvData.filter(record => 
      !existingServersSet.has(record.srv)
    );

    if (serversToImport.length === 0) {
      return { 
        info: "Tous les serveurs sont déjà importés. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allPsadmSrvData.length,
          totalInHarpserve: existingServers.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingServers.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpserve AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouveaux serveurs
    const result = await prisma.harpserve.createMany({
      data: serversToImport.map(record => ({
        srv: record.srv,
        ip: record.ip,
        pshome: record.pshome,
        os: record.os,
        psuser: record.psuser,
        domain: record.domain,
        statenvId: 8,
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    console.log(`Migration terminée. ${result.count} enregistrements insérés.`);
    return { 
      success: `${result.count} nouveau(x) serveur(s) inséré(s) dans HARPSERV !`,
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
    // Vérifier si envsharp est vide
    const envsharpCount = await prisma.envsharp.count()
    
    if (envsharpCount > 0) {
       return { info: "La table envsharp n'est pas vide." };
    }

    // Récupérer les données de psadm_env
    const psadmEnvData = await prisma.psadm_env.findMany()


    if (psadmEnvData.length === 0) {
      return { info: "La table psadm_env est vide." };
   }

     // Réinitialiser l'auto-increment
     await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

    // Insérer les données dans envsharp
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
        statenvId: record.statenvId
      }))
    })

    console.log(`Migration terminée. ${result.count} enregistrements insérés.`)
    return { success: `${result.count} enregistrements insérés dans ENVSHARP !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'import dans ENVSHARP", "migrateDataToEnvsharp");
  // } finally {
  //   await prisma.$disconnect()
  }
};

// ... existing code ...

export const migrerLesUtilisateursNEW = async () => {
  try {
    // Vérifier si la table User existe et si elle est vide
    let count = 0;
    try {
      count = await prisma.user.count();
    } catch (error) {
      // Si la table n'existe pas, on doit d'abord exécuter les migrations Prisma
      console.error('[Migration] La table User n\'existe pas encore. Veuillez exécuter: npx prisma migrate dev');
      return { 
        error: "La table User n'existe pas encore. Veuillez exécuter 'npx prisma migrate dev' ou 'npx prisma db push' pour créer les tables." 
      };
    }
    
    // if (count > 1) {
    //   return { info: "La table user contient déjà tous les utilisateurs Harp. Importation ignorée." };
    // }

    // Réinitialiser l'auto-increment seulement si la table existe et contient des données
    if (count > 0) {
      try {
        await prisma.$executeRaw`ALTER TABLE User AUTO_INCREMENT = 1`;
      } catch (error) {
        // Ignorer l'erreur si la table est vide ou si l'auto-increment ne peut pas être modifié
        console.warn('[Migration] Impossible de réinitialiser l\'auto-increment, continuation...');
      }
    }

    // Vérifier d'abord si la table psadm_user contient des utilisateurs
    const psadmUserCount = await prisma.psadm_user.count();
    if (psadmUserCount === 0) {
      return { error: "La table psadm_user est vide. Aucun utilisateur à migrer." };
    }

    console.log(`[Migration] Nombre d'utilisateurs dans User: ${count}, dans psadm_user: ${psadmUserCount}`);

    // Récupérer tous les utilisateurs de psadm_user avec une requête SQL brute
    // pour gérer les dates invalides (0000-00-00) qui causent des erreurs Prisma
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
      return { error: "Aucun utilisateur trouvé dans psadm_user après la requête SQL." };
    }

    // Convertir les dates string en Date et filtrer les valeurs invalides
    const usersToCreate = psadmUsersRaw.map(user => {
      // Convertir lastlogin de string à Date si valide
      let lastloginDate: Date | null = null;
      if (user.lastlogin) {
        try {
          const date = new Date(user.lastlogin);
          // Vérifier que la date est valide
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            lastloginDate = date;
          }
        } catch {
          // Si la conversion échoue, garder null
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

    // Filtrer les utilisateurs qui existent déjà pour ne créer que ceux qui manquent
    // Cela permet de forcer l'import même si la table User n'est pas vide
    const existingNetIds = await prisma.user.findMany({
      select: { netid: true }
    });
    const existingNetIdsSet = new Set(existingNetIds.map(u => u.netid));
    
    const usersToCreateFiltered = usersToCreate.filter(user => !existingNetIdsSet.has(user.netid));

    if (usersToCreateFiltered.length === 0) {
      return { info: `Tous les utilisateurs (${usersToCreate.length}) existent déjà dans la table User. Aucun nouvel utilisateur à créer.` };
    }

    console.log(`[Migration] ${usersToCreateFiltered.length} utilisateur(s) manquant(s) sur ${usersToCreate.length} total. Tentative de création...`);

    // Créer uniquement les utilisateurs manquants
    const createdUsers = await prisma.user.createMany({
      data: usersToCreateFiltered,
      skipDuplicates: true // Ignore les doublons basés sur les champs uniques (netid)
    });

    console.log(`[Migration] ${createdUsers.count} utilisateur(s) créé(s) avec succès.`);

    if (createdUsers.count === 0) {
      return { info: "Aucun nouvel utilisateur créé. Tous les utilisateurs existent déjà dans la table User." };
    }

    return { success: `${createdUsers.count} utilisateur(s) migré(s) vers Prisma avec succès !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la migration des utilisateurs vers Prisma.", "migrerLesUtilisateursNEW");
  }
}

 
// ... existing code ...

export const OLD_importerLesEnvInfos = async () => {
  try {
    // Vérifier si la table est vide
    const count = await prisma.harpenvinfo.count();
    
    if (count > 0) {
      return { info: "La table harpenvinfo contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpenvinfo AUTO_INCREMENT = 1`;

    // Récupérer les données avec un JOIN entre envsharp et 
    
    const results = await prisma.$queryRaw`
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

    return { success: `${importedData.count} informations d'environnements importées avec succès !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des informations d'environnements", "importerLesEnvInfos");
  }
};


/**
 * Importe les informations d'environnement de psadm_envinfo vers harpenvinfo
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesEnvInfos = async () => {
  try {
    await prisma.$executeRaw`UPDATE psadm_envinfo SET datadt = NOW() where datadt is null`;
    await prisma.$executeRaw`UPDATE psadm_envinfo SET datadt = NOW() where datadt = 0`;
    await prisma.$executeRaw`UPDATE psadm_envinfo SET refreshdt = datmaj where refreshdt is null`;
    await prisma.$executeRaw`UPDATE psadm_envinfo SET refreshdt = datmaj where refreshdt = 0`;
    await prisma.$executeRaw`UPDATE psadm_envinfo SET modedt = datmaj where modedt is null`;
    await prisma.$executeRaw`UPDATE psadm_envinfo SET modedt = datmaj where modedt = 0`;

    // Récupérer tous les environnements
    const allEnvs = await prisma.envsharp.findMany({
      select: {
        id: true,
        env: true,
      }
    });

    // Récupérer toutes les informations d'environnement
    const allEnvInfos = await prisma.psadm_envinfo.findMany();

    // Préparer toutes les données pour l'import
    const allDataToImport = allEnvs.map(env => {
      const matchingInfo = allEnvInfos.find(info => info.env === env.env);
      if (!matchingInfo) return null;

      return {
        envId: env.id,
        datadt: matchingInfo.datadt || new Date(),
        modetp: matchingInfo.modetp,
        refreshdt: matchingInfo.refreshdt || new Date(),
        lastcheckstatus: matchingInfo.lastcheckstatus,
        lastcheckdt: matchingInfo.lastcheckdt || new Date(),
        lastcheckmsg: matchingInfo.lastcheckmsg,
        datmaj: matchingInfo.datmaj || new Date(),
        deploycbldt: matchingInfo.deploycbldt,
        userunx: matchingInfo.userunx,
        pswd_ft_exploit: matchingInfo.pswd_ft_exploit
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    if (allDataToImport.length === 0) {
      return { info: "Aucune information d'environnement trouvée à importer." };
    }

    // Récupérer les informations déjà présentes dans harpenvinfo
    const existingInfos = await prisma.harpenvinfo.findMany({
      select: {
        envId: true
      }
    });

    // Créer un Set des envIds existants pour une recherche rapide
    // Clé unique: envId
    const existingEnvIdsSet = new Set(existingInfos.map(info => info.envId));

    // Filtrer uniquement les informations qui n'existent pas encore (delta)
    const infosToImport = allDataToImport.filter(data => 
      !existingEnvIdsSet.has(data.envId)
    );

    if (infosToImport.length === 0) {
      return { 
        info: "Toutes les informations d'environnement sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allDataToImport.length,
          totalInHarpenvinfo: existingInfos.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingInfos.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvinfo AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles informations
    const importedData = await prisma.harpenvinfo.createMany({
      data: infosToImport,
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) information(s) d'environnement importée(s) avec succès !`,
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
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerOraInstances = async () => {
  try {
    // Récupérer toutes les instances Oracle distinctes
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
      return { info: "Aucune instance Oracle trouvée à importer." };
    }

    // Récupérer les instances déjà présentes dans harpinstance
    const existingInstances = await prisma.harpinstance.findMany({
      select: {
        oracle_sid: true
      }
    });

    // Créer un Set des instances existantes pour une recherche rapide
    // Clé unique: oracle_sid
    const existingInstancesSet = new Set(existingInstances.map(inst => inst.oracle_sid));

    // Filtrer uniquement les instances qui n'existent pas encore (delta)
    const instancesToImport = allResults.filter(result => 
      !existingInstancesSet.has(result.oracle_sid)
    );

    if (instancesToImport.length === 0) {
      return { 
        info: "Toutes les instances Oracle sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpinstance: existingInstances.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingInstances.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpinstance AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles instances
    const importedData = await prisma.harpinstance.createMany({
      data: instancesToImport.map(result => ({
        oracle_sid: result.oracle_sid
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) instance(s) Oracle importée(s) avec succès !`,
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


export const updateInstanceServerIds = async () => {
  try {
    // Vérifier si les tables nécessaires contiennent des données
    const countInstances = await prisma.harpinstance.count();
    if (countInstances === 0) {
      return { info: "La table harpinstance est vide. Veuillez d'abord importer les instances." };
    }

    const countServers = await prisma.harpserve.count();
    if (countServers === 0) {
      return { info: "La table harpserve est vide. Veuillez d'abord importer les serveurs." };
    }

    // Récupérer les relations entre instances et serveurs
    const relations = await prisma.$queryRaw`
      SELECT DISTINCT o.id as instanceId, h.id as serverId
      FROM harpinstance o
      JOIN psadm_env e ON o.oracle_sid = e.oracle_sid
      JOIN psadm_rolesrv s ON s.env = e.env
      JOIN harpserve h ON h.srv = s.srv
      ORDER BY o.id
    `;

    // Mettre à jour chaque instance avec son serverId correspondant (séquentiellement pour éviter les conflits de concurrence)
    for (const relation of relations as any[]) {
      await prisma.harpinstance.update({
        where: { id: relation.instanceId },
        data: { serverId: relation.serverId }
      });
    }

    return { success: `Les relations instance-serveur ont été mises à jour avec succès !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour des relations instance-serveur", "updateInstanceServerIds");
  }
};
// select * from psadm_rolesrv where env like '%HPR1'; 
/**
 * Importe les relations environnement-serveur de psadm_rolesrv vers harpenvserv
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesEnvServeurs = async () => {
  try {
    // Mettre à jour les statuts avant l'import
    await prisma.$executeRaw`update psadm_rolesrv set status = 8 where status = 21`;
    await prisma.$executeRaw`update psadm_rolesrv set status = 8 where status is null`;

    // Récupérer toutes les données avec la requête
    const allResults = await prisma.$queryRaw<Array<{
      envId: number;
      serverId: number;
      typsrv: string;
      status: number;
    }>>`
      SELECT 
        e.id as envId,
        s.id as serverId,
        r.typsrv,
        r.status
      FROM envsharp e, harpserve s, psadm_rolesrv r
      WHERE e.env = r.env AND s.srv = r.srv 
      ORDER BY e.env
    `;

    if (allResults.length === 0) {
      return { info: "Aucune relation environnement-serveur trouvée à importer." };
    }

    // Récupérer les relations déjà présentes dans harpenvserv
    const existingRelations = await prisma.harpenvserv.findMany({
      select: {
        envId: true,
        serverId: true,
        typsrv: true
      }
    });

    // Créer un Set des relations existantes pour une recherche rapide
    // Clé unique: envId + serverId + typsrv
    const existingRelationsSet = new Set(
      existingRelations.map(rel => `${rel.envId}-${rel.serverId}-${rel.typsrv}`)
    );

    // Filtrer uniquement les relations qui n'existent pas encore (delta)
    const relationsToImport = allResults.filter(result => {
      const key = `${result.envId}-${result.serverId}-${result.typsrv}`;
      return !existingRelationsSet.has(key);
    });

    if (relationsToImport.length === 0) {
      return { 
        info: "Toutes les relations environnement-serveur sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpenvserv: existingRelations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingRelations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvserv AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles relations
    const importedData = await prisma.harpenvserv.createMany({
      data: relationsToImport.map(result => ({
        envId: result.envId,
        serverId: result.serverId,
        typsrv: result.typsrv,
        status: result.status
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) relation(s) environnement-serveur importée(s) avec succès !`,
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
    // Vérifier si les tables nécessaires contiennent des données
    const countEnvs = await prisma.envsharp.count();
    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    const countInstances = await prisma.harpinstance.count();
    if (countInstances === 0) {
      return { info: "La table harpinstance est vide. Veuillez d'abord importer les instances." };
    }

    // Récupérer les relations entre environnements et instances
    const relations = await prisma.$queryRaw`
      SELECT e.id, i.id as instanceId
      FROM psadm_env p, envsharp e, harpinstance i        
      WHERE e.env = p.env
        AND p.oracle_sid = i.oracle_sid
      ORDER BY e.id
    `;

    // Mettre à jour chaque environnement avec son instanceId correspondant (séquentiellement pour éviter les conflits de concurrence)
    for (const relation of relations as any[]) {
      await prisma.envsharp.update({
        where: { id: relation.id },
        data: { instanceId: relation.instanceId }
      });
    }

    return { success: `Les relations environnement-instance ont été mises à jour avec succès !` };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour des relations environnement-instance", "updateEnvsharpInstanceIds");
  }
};


export const updateEnvsharpOrarelease = async () => {
  try {
    // Vérifier si la table envsharp contient des données
    const countEnvs = await prisma.envsharp.count();
    
    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // Récupérer les relations entre envsharp et psadm_oracle
    const relations = await prisma.$queryRaw`
      SELECT e.id, o.orarelease
      FROM envsharp e
      JOIN psadm_oracle o ON e.aliasql = o.aliasql
      WHERE o.orarelease IS NOT NULL
    `;

    // Mettre à jour chaque environnement avec son orarelease correspondant (séquentiellement pour éviter les conflits de concurrence)
    let updateCount = 0;
    for (const relation of relations as any[]) {
      await prisma.envsharp.update({
        where: { id: relation.id },
        data: { orarelease: relation.orarelease }
      });
      updateCount++;
    }

    return { success: `${updateCount} environnements mis à jour avec leur version Oracle !` };

  } catch (error) {
    return handlePrismaError(error, "Erreur lors de la mise à jour des versions Oracle dans ENVSHARP", "updateEnvsharpOrarelease");
  }
};



// ... existing code ...

/**
 * Importe les dispositions d'environnement de psadm_dispo vers harpenvdispo
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesEnvDispos = async () => {
  try {
    // Récupérer toutes les données avec la requête
    const allResults = await prisma.$queryRaw<Array<{
      envId: number;
      fromdate: Date;
      msg: string | null;
      statenvId: number | null;
    }>>`
      SELECT 
        e.id as envId,
        d.fromdate,
        d.msg,
        d.statenvId 
      FROM 
        envsharp e,
        psadm_dispo d
      WHERE d.env = e.env
      ORDER BY e.env, d.fromdate DESC
    `;

    if (allResults.length === 0) {
      return { info: "Aucune disposition d'environnement trouvée à importer." };
    }

    // Récupérer les dispositions déjà présentes dans harpenvdispo
    const existingDispos = await prisma.harpenvdispo.findMany({
      select: {
        envId: true,
        fromdate: true
      }
    });

    // Créer un Set des dispositions existantes pour une recherche rapide
    // Clé unique: envId + fromdate
    const existingDisposSet = new Set(
      existingDispos.map(dispo => `${dispo.envId}-${dispo.fromdate.getTime()}`)
    );

    // Filtrer uniquement les dispositions qui n'existent pas encore (delta)
    const disposToImport = allResults.filter(result => {
      const key = `${result.envId}-${result.fromdate.getTime()}`;
      return !existingDisposSet.has(key);
    });

    if (disposToImport.length === 0) {
      return { 
        info: "Toutes les dispositions d'environnement sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpenvdispo: existingDispos.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingDispos.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpenvdispo AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles dispositions
    const importedData = await prisma.harpenvdispo.createMany({
      data: disposToImport.map(result => ({
        envId: result.envId,
        fromdate: result.fromdate || new Date(),
        msg: result.msg,
        statenvId: result.statenvId || 8 // Utilise 8 (OUVERT) comme valeur par défaut si statenvId est null
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) disposition(s) d'environnement importée(s) avec succès !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpenvdispo: existingDispos.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - disposToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des dispositions d'environnements", "importerLesEnvDispos");
  }
};

/**
 * Importe les outils de psadm_tools vers harptools
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesTools = async () => {
  try {
    // Récupérer toutes les données de psadm_tools
    const allPsadmTools = await prisma.psadm_tools.findMany({
      orderBy: {
        descr: 'asc',
      },
    });

    if (allPsadmTools.length === 0) {
      return { info: "La table psadm_tools est vide. Aucune donnée à importer." };
    }

    // Récupérer les outils déjà présents dans harptools
    const existingTools = await prisma.harptools.findMany({
      select: {
        cmd: true,
        tooltype: true,
        descr: true
      }
    });

    // Créer un Set des outils existants pour une recherche rapide
    // Clé unique: cmd + tooltype + descr (pour identifier les outils uniques)
    const existingToolsSet = new Set(
      existingTools.map(tool => `${tool.cmd}-${tool.tooltype}-${tool.descr}`)
    );

    // Filtrer uniquement les outils qui n'existent pas encore (delta)
    const toolsToImport = allPsadmTools.filter(tool => {
      const key = `${tool.cmd}-${tool.tooltype}-${tool.descr}`;
      return !existingToolsSet.has(key);
    });

    if (toolsToImport.length === 0) {
      return { 
        info: "Tous les outils sont déjà importés. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allPsadmTools.length,
          totalInHarptools: existingTools.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingTools.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harptools AUTO_INCREMENT = 1`;
    }

    // Mapper les données de psadm_tools vers harptools et insérer uniquement les nouveaux outils
    const importedData = await prisma.harptools.createMany({
      data: toolsToImport.map((tool) => ({
        tool: "", // Colonne tool non importée, laissée vide
        cmdpath: "", // Champ non présent dans psadm_tools, laissé vide
        cmd: tool.cmd,
        version: "", // Champ non présent dans psadm_tools, laissé vide
        descr: tool.descr,
        tooltype: tool.tooltype,
        cmdarg: tool.cmdarg || "",
        mode: tool.mode || "",
        output: tool.output || "",
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouveau(x) outil(s) importé(s) avec succès depuis psadm_tools vers harptools !`,
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
 * Importe les associations utilisateur-rôle vers harpuseroles
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesUserRoles = async () => {
  try {
    // Exécuter la requête SQL pour récupérer toutes les associations user-role
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
      return { info: "Aucune association utilisateur-rôle trouvée à importer." };
    }

    // Récupérer les associations déjà présentes dans harpuseroles
    const existingAssociations = await prisma.harpuseroles.findMany({
      select: {
        userId: true,
        roleId: true
      }
    });

    // Créer un Set des associations existantes pour une recherche rapide
    // Clé unique: userId + roleId (clé primaire composite)
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
        info: "Toutes les associations utilisateur-rôle sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpuseroles: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpuseroles AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles associations
    const importedData = await prisma.harpuseroles.createMany({
      data: associationsToImport.map((row) => ({
        userId: row.userId,
        roleId: row.roleId,
        // datmaj sera automatiquement défini par la valeur par défaut
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) association(s) utilisateur-rôle importée(s) avec succès !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpuseroles: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des associations utilisateur-rôle", "importerLesUserRoles");
  }
};

/**
 * Importe les associations rôle-menu vers harpmenurole
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesMenuRoles = async () => {
  try {
    // Exécuter la requête SQL pour récupérer toutes les associations role-menu
    const allResults = await prisma.$queryRaw<Array<{
      roleId: number;
      menuId: number;
      menu: string;
    }>>`
      SELECT 
        e.id as roleId, 
        f.id as menuId, 
        f.menu
      FROM User a, psadm_user b, psadm_typenv c, psadm_roleuser d, harproles e, harpmenus f
      WHERE a.netid = b.netid 
        AND a.netid = d.netid 
        AND b.defpage = c.href
        AND d.role = e.role
        AND c.typenv = f.menu
      ORDER BY d.role
    `;

    if (allResults.length === 0) {
      return { info: "Aucune association rôle-menu trouvée à importer." };
    }

    // Récupérer les associations déjà présentes dans harpmenurole
    const existingAssociations = await prisma.harpmenurole.findMany({
      select: {
        roleId: true,
        menuId: true
      }
    });

    // Créer un Set des associations existantes pour une recherche rapide
    // Clé unique: roleId + menuId (clé primaire composite)
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
        info: "Toutes les associations rôle-menu sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allResults.length,
          totalInHarpmenurole: existingAssociations.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingAssociations.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpmenurole AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles associations
    const importedData = await prisma.harpmenurole.createMany({
      data: associationsToImport.map((row) => ({
        roleId: row.roleId,
        menuId: row.menuId,
        // datmaj sera automatiquement défini par la valeur par défaut
      })),
      skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
    });

    return { 
      success: `${importedData.count} nouvelle(s) association(s) rôle-menu importée(s) avec succès !`,
      details: {
        totalInSource: allResults.length,
        totalInHarpmenurole: existingAssociations.length + importedData.count,
        imported: importedData.count,
        skipped: allResults.length - associationsToImport.length
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des associations rôle-menu", "importerLesMenuRoles");
  }
};

/**
 * Importe les données de monitoring de psadm_monitor vers harpmonitor
 * Détecte et importe uniquement les enregistrements manquants (delta)
 * 
 * @returns Un objet avec success/info/warning/error et les détails de l'importation
 */
export const importerLesMonitors = async () => {
  try {
    // Vérifier si la table envsharp contient des données
    const countEnvs = await prisma.envsharp.count();
    
    if (countEnvs === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }

    // Nettoyer les dates invalides dans psadm_monitor avant l'import
    // Remplacer les dates '0000-00-00' par la date actuelle
    try {
      await prisma.$executeRaw`
        UPDATE psadm_monitor 
        SET monitordt = NOW() 
        WHERE monitordt IS NULL 
           OR monitordt = '0000-00-00 00:00:00'
           OR DATE(monitordt) = '0000-00-00'
      `;
    } catch (error) {
      console.warn("[importerLesMonitors] Impossible de nettoyer les dates invalides, continuation...", error);
    }

    // Récupérer toutes les données de psadm_monitor avec une requête SQL brute
    // pour gérer les dates invalides (0000-00-00) que Prisma ne peut pas lire directement
    const allMonitorDataRaw = await prisma.$queryRaw<Array<{
      env: string;
      monitordt: string | null;
      dbstatus: number | null;
      nbdom: number | null;
      asstatus1: number | null;
      asstatus2: number | null;
      asstatus3: number | null;
      asstatus4: number | null;
      asstatus5: number | null;
      lastasdt: string | null;
      prcsunxstatus: number | null;
      lastprcsunxdt: string | null;
      prcsntstatus: number | null;
      lastprcsntdt: string | null;
      lastlogin: string | null;
      lastlogindt: string | null;
    }>>`
      SELECT 
        env,
        CASE 
          WHEN monitordt IS NULL 
             OR monitordt = '0000-00-00 00:00:00' 
             OR DATE(monitordt) = '0000-00-00'
          THEN NULL 
          ELSE monitordt 
        END as monitordt,
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
        END as lastasdt,
        prcsunxstatus,
        CASE 
          WHEN lastprcsunxdt IS NULL 
             OR lastprcsunxdt = '0000-00-00 00:00:00' 
             OR DATE(lastprcsunxdt) = '0000-00-00'
          THEN NULL 
          ELSE lastprcsunxdt 
        END as lastprcsunxdt,
        prcsntstatus,
        CASE 
          WHEN lastprcsntdt IS NULL 
             OR lastprcsntdt = '0000-00-00 00:00:00' 
             OR DATE(lastprcsntdt) = '0000-00-00'
          THEN NULL 
          ELSE lastprcsntdt 
        END as lastprcsntdt,
        lastlogin,
        CASE 
          WHEN lastlogindt IS NULL 
             OR lastlogindt = '0000-00-00 00:00:00' 
             OR DATE(lastlogindt) = '0000-00-00'
          THEN NULL 
          ELSE lastlogindt 
        END as lastlogindt
      FROM psadm_monitor
      ORDER BY env ASC, monitordt DESC
    `;

    if (allMonitorDataRaw.length === 0) {
      return { info: "Aucune donnée de monitoring trouvée à importer." };
    }

    // Récupérer tous les environnements de envsharp pour le mapping
    const allEnvs = await prisma.envsharp.findMany({
      select: {
        id: true,
        env: true
      }
    });

    // Créer un Map pour une recherche rapide des envId
    const envMap = new Map(allEnvs.map(env => [env.env, env.id]));

    // Préparer toutes les données pour l'import avec validation
    // Compter les environnements ignorés pour éviter de logger chaque occurrence
    const ignoredEnvs = new Map<string, number>();
    
    const allDataToImport = allMonitorDataRaw
      .map(monitor => {
        const envId = envMap.get(monitor.env);
        
        // Ignorer les enregistrements sans environnement correspondant dans envsharp
        if (!envId) {
          // Compter les occurrences au lieu de logger chaque fois
          const count = ignoredEnvs.get(monitor.env) || 0;
          ignoredEnvs.set(monitor.env, count + 1);
          return null;
        }

        // Convertir monitordt (qui est maintenant une chaîne ou null depuis la requête SQL)
        let monitordtDate: Date;
        if (!monitor.monitordt) {
          // Si null, utiliser la date actuelle
          monitordtDate = new Date();
        } else {
          try {
            const date = new Date(monitor.monitordt);
            if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
              monitordtDate = new Date();
            } else {
              monitordtDate = date;
            }
          } catch {
            monitordtDate = new Date();
          }
        }
        
        // S'assurer que la date est valide avant de continuer
        if (isNaN(monitordtDate.getTime())) {
          monitordtDate = new Date();
        }

        // Convertir les dates optionnelles (déjà filtrées par la requête SQL)
        let lastasdtDate: Date | null = null;
        if (monitor.lastasdt) {
          try {
            const date = new Date(monitor.lastasdt);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              lastasdtDate = date;
            }
          } catch {
            // Garder null si la conversion échoue
          }
        }

        let lastprcsunxdtDate: Date | null = null;
        if (monitor.lastprcsunxdt) {
          try {
            const date = new Date(monitor.lastprcsunxdt);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              lastprcsunxdtDate = date;
            }
          } catch {
            // Garder null si la conversion échoue
          }
        }

        let lastprcsntdtDate: Date | null = null;
        if (monitor.lastprcsntdt) {
          try {
            const date = new Date(monitor.lastprcsntdt);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              lastprcsntdtDate = date;
            }
          } catch {
            // Garder null si la conversion échoue
          }
        }

        let lastlogindtDate: Date | null = null;
        if (monitor.lastlogindt) {
          try {
            const date = new Date(monitor.lastlogindt);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              lastlogindtDate = date;
            }
          } catch {
            // Garder null si la conversion échoue
          }
        }

        return {
          envId: envId,
          monitordt: monitordtDate,
          dbstatus: monitor.dbstatus ?? null,
          nbdom: monitor.nbdom ?? null,
          asstatus1: monitor.asstatus1 ?? null,
          asstatus2: monitor.asstatus2 ?? null,
          asstatus3: monitor.asstatus3 ?? null,
          asstatus4: monitor.asstatus4 ?? null,
          asstatus5: monitor.asstatus5 ?? null,
          lastasdt: lastasdtDate,
          prcsunxstatus: monitor.prcsunxstatus ?? null,
          lastprcsunxdt: lastprcsunxdtDate,
          prcsntstatus: monitor.prcsntstatus ?? null,
          lastprcsntdt: lastprcsntdtDate,
          lastlogin: monitor.lastlogin ?? null,
          lastlogindt: lastlogindtDate
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Logger un résumé des environnements ignorés si nécessaire
    if (ignoredEnvs.size > 0) {
      const ignoredSummary = Array.from(ignoredEnvs.entries())
        .map(([env, count]) => `${env} (${count} enregistrement(s))`)
        .join(', ');
      const ignoredEnvNames = Array.from(ignoredEnvs.keys());
      
      console.warn(`[importerLesMonitors] ${ignoredEnvs.size} environnement(s) ignoré(s) car non trouvé(s) dans envsharp: ${ignoredSummary}`);
      console.warn(`[importerLesMonitors] 💡 Suggestion: Exécutez d'abord 'importListEnvs()' pour importer ces environnements depuis psadm_env vers envsharp`);
      console.warn(`[importerLesMonitors] Environnements à importer: ${ignoredEnvNames.join(', ')}`);
      
      // Vérifier si ces environnements existent dans psadm_env
      const envsInPsadmEnv = await prisma.psadm_env.findMany({
        where: {
          env: {
            in: ignoredEnvNames
          }
        },
        select: {
          env: true
        }
      });
      
      const envsInPsadmEnvNames = envsInPsadmEnv.map(e => e.env);
      const envsNotInPsadmEnv = ignoredEnvNames.filter(env => !envsInPsadmEnvNames.includes(env));
      
      if (envsInPsadmEnvNames.length > 0) {
        console.warn(`[importerLesMonitors] ✓ ${envsInPsadmEnvNames.length} environnement(s) trouvé(s) dans psadm_env: ${envsInPsadmEnvNames.join(', ')}`);
        console.warn(`[importerLesMonitors] → Ces environnements peuvent être importés avec 'importListEnvs()'`);
      }
      
      if (envsNotInPsadmEnv.length > 0) {
        console.warn(`[importerLesMonitors] ⚠ ${envsNotInPsadmEnv.length} environnement(s) non trouvé(s) dans psadm_env: ${envsNotInPsadmEnv.join(', ')}`);
        console.warn(`[importerLesMonitors] → Ces environnements n'existent pas dans psadm_env et ne peuvent pas être importés`);
      }
    }

    if (allDataToImport.length === 0) {
      const ignoredEnvNames = Array.from(ignoredEnvs.keys());
      const ignoredCount = Array.from(ignoredEnvs.values()).reduce((sum, count) => sum + count, 0);
      
      // Vérifier si ces environnements existent dans psadm_env
      let suggestion = "";
      if (ignoredEnvs.size > 0) {
        const envsInPsadmEnv = await prisma.psadm_env.findMany({
          where: {
            env: {
              in: ignoredEnvNames
            }
          },
          select: {
            env: true
          }
        });
        
        if (envsInPsadmEnv.length > 0) {
          suggestion = ` Exécutez d'abord 'importListEnvs()' pour importer ${envsInPsadmEnv.length} environnement(s) depuis psadm_env vers envsharp.`;
        }
      }
      
      return { 
        info: `Aucune donnée de monitoring valide trouvée à importer.${suggestion}`,
        details: {
          totalInSource: allMonitorDataRaw.length,
          ignoredEnvironments: ignoredEnvs.size,
          ignoredRecords: ignoredCount,
          ignoredEnvNames: ignoredEnvNames
        }
      };
    }

    // Récupérer les données de monitoring déjà présentes dans harpmonitor
    const existingMonitors = await prisma.harpmonitor.findMany({
      select: {
        envId: true,
        monitordt: true
      }
    });

    // Fonction pour normaliser une date (arrondir à la seconde pour éviter les problèmes de précision)
    const normalizeDate = (date: Date): string => {
      const normalized = new Date(date);
      normalized.setMilliseconds(0);
      return normalized.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Créer un Set des monitors existants pour une recherche rapide
    // Clé unique: envId + monitordt normalisé (format YYYY-MM-DD HH:mm:ss)
    const existingMonitorsSet = new Set(
      existingMonitors.map(monitor => {
        try {
          const normalized = normalizeDate(monitor.monitordt);
          return `${monitor.envId}-${normalized}`;
        } catch {
          // Si la date est invalide, utiliser le timestamp
          return `${monitor.envId}-${monitor.monitordt.getTime()}`;
        }
      })
    );

    // Filtrer uniquement les monitors qui n'existent pas encore (delta)
    const monitorsToImport = allDataToImport.filter(data => {
      try {
        const normalized = normalizeDate(data.monitordt);
        const key = `${data.envId}-${normalized}`;
        return !existingMonitorsSet.has(key);
      } catch {
        // Si la normalisation échoue, utiliser le timestamp
        const key = `${data.envId}-${data.monitordt.getTime()}`;
        return !existingMonitorsSet.has(key);
      }
    });

    if (monitorsToImport.length === 0) {
      return { 
        info: "Toutes les données de monitoring sont déjà importées. Aucun nouveau enregistrement à importer.",
        details: {
          totalInSource: allDataToImport.length,
          totalInHarpmonitor: existingMonitors.length,
          imported: 0
        }
      };
    }

    // Si c'est le premier import (table vide), réinitialiser l'auto-increment
    if (existingMonitors.length === 0) {
      await prisma.$executeRaw`ALTER TABLE harpmonitor AUTO_INCREMENT = 1`;
    }

    // Insérer uniquement les nouvelles données de monitoring
    // Traiter par petits lots avec délais pour éviter les erreurs de connexion (ECONNRESET)
    const BATCH_SIZE = 50; // Réduit de 100 à 50 pour éviter les timeouts
    let totalImported = 0;
    const errors: string[] = [];
    
    // Fonction de retry pour les erreurs de connexion
    const retryOperation = async <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          const errorObj = error as { code?: string; message?: string };
          const isConnectionError = error instanceof Error && (
            error.message.includes('ECONNRESET') ||
            error.message.includes('aborted') ||
            errorObj.code === 'ECONNRESET' ||
            errorObj.code === 'P1001' ||
            errorObj.code === 'P1017'
          );
          
          if (isConnectionError && attempt < maxRetries) {
            console.warn(`[importerLesMonitors] Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Délai progressif
            continue;
          }
          throw error;
        }
      }
      throw new Error('Toutes les tentatives ont échoué');
    };

    for (let i = 0; i < monitorsToImport.length; i += BATCH_SIZE) {
      const batch = monitorsToImport.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(monitorsToImport.length / BATCH_SIZE);
      
      try {
        // Afficher la progression
        if (batchNumber % 10 === 0 || batchNumber === 1) {
          console.log(`[importerLesMonitors] Traitement du lot ${batchNumber}/${totalBatches} (${batch.length} enregistrement(s))...`);
        }
        
        // Utiliser retry pour les erreurs de connexion
        const result = await retryOperation(async () => {
          return await prisma.harpmonitor.createMany({
            data: batch,
            skipDuplicates: true // Sécurité supplémentaire pour éviter les doublons
          });
        });
        
        totalImported += result.count;
        
        // Petit délai entre les lots pour laisser la connexion se récupérer
        if (i + BATCH_SIZE < monitorsToImport.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre les lots
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorObj = error as { code?: string };
        const isConnectionError = errorMsg.includes('ECONNRESET') || 
                                 errorMsg.includes('aborted') ||
                                 errorObj.code === 'ECONNRESET';
        
        errors.push(`Lot ${batchNumber}: ${errorMsg}`);
        console.error(`[importerLesMonitors] Erreur lors de l'import du lot ${batchNumber}:`, error);
        
        // Pour les erreurs de connexion, essayer d'insérer un par un avec délais
        if (isConnectionError) {
          console.warn(`[importerLesMonitors] Erreur de connexion détectée, insertion un par un avec délais...`);
          for (const item of batch) {
            try {
              await retryOperation(async () => {
                await prisma.harpmonitor.create({
                  data: item
                });
              }, 2, 500); // 2 tentatives avec 500ms de délai
              totalImported++;
              
              // Petit délai entre chaque insertion pour éviter de surcharger la connexion
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (itemError) {
              const itemErrorMsg = itemError instanceof Error ? itemError.message : String(itemError);
              console.error(`[importerLesMonitors] Erreur persistante pour envId ${item.envId}, monitordt ${item.monitordt}:`, itemErrorMsg);
            }
          }
        } else {
          // Pour les autres erreurs, essayer d'insérer un par un sans délai supplémentaire
          for (const item of batch) {
            try {
              await prisma.harpmonitor.create({
                data: item
              });
              totalImported++;
            } catch (itemError) {
              const itemErrorMsg = itemError instanceof Error ? itemError.message : String(itemError);
              console.error(`[importerLesMonitors] Erreur pour envId ${item.envId}, monitordt ${item.monitordt}:`, itemErrorMsg);
            }
          }
        }
      }
    }

    if (errors.length > 0 && totalImported === 0) {
      return {
        error: `Aucune donnée n'a pu être importée. ${errors.length} erreur(s) rencontrée(s).`,
        details: {
          totalInSource: allMonitorDataRaw.length,
          totalInHarpmonitor: existingMonitors.length,
          imported: totalImported,
          errors: errors.slice(0, 5) // Limiter à 5 erreurs pour éviter un message trop long
        }
      };
    }

    if (errors.length > 0) {
      return {
        warning: `${totalImported} donnée(s) de monitoring importée(s) avec ${errors.length} erreur(s).`,
        details: {
          totalInSource: allMonitorDataRaw.length,
          totalInHarpmonitor: existingMonitors.length + totalImported,
          imported: totalImported,
          skipped: allDataToImport.length - monitorsToImport.length,
          errors: errors.slice(0, 3) // Limiter à 3 erreurs
        }
      };
    }

    const ignoredCount = Array.from(ignoredEnvs.values()).reduce((sum, count) => sum + count, 0);
    const ignoredEnvNames = Array.from(ignoredEnvs.keys());
    
    // Construire le message de succès avec information sur les environnements ignorés
    let successMessage = `${totalImported} nouvelle(s) donnée(s) de monitoring importée(s) avec succès !`;
    if (ignoredEnvs.size > 0) {
      successMessage += ` (${ignoredCount} enregistrement(s) ignoré(s) pour ${ignoredEnvs.size} environnement(s) non trouvé(s) dans envsharp)`;
    }
    
    return { 
      success: successMessage,
      details: {
        totalInSource: allMonitorDataRaw.length,
        totalInHarpmonitor: existingMonitors.length + totalImported,
        imported: totalImported,
        skipped: allDataToImport.length - monitorsToImport.length,
        ignoredEnvironments: ignoredEnvs.size,
        ignoredRecords: ignoredCount,
        ignoredEnvNames: ignoredEnvNames
      }
    };
  } catch (error) {
    return handlePrismaError(error, "Erreur lors de l'importation des données de monitoring", "importerLesMonitors");
  }
};




