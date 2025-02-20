"use server";

import * as z from "zod";
import { toast } from "react-toastify";
import prisma  from "@/lib/prisma";


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
     return { error: "HARP Erreur lors de l'importation des statuts d'environnement" };
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
    
    // Mettre à jour chaque disposition
    const updates = dispositions.map(async (dispo) => {
      const matchingStatutenv = statutenvs.find(
        statut => statut.statenv === dispo.statenv
      );
      
      if (matchingStatutenv) {
        return prisma.psadm_dispo.update({
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
      }
    });

    const result = await Promise.all(updates.filter(Boolean));

    return { success: "La mise à jour de statut d'environnements terminée avec succès !" };
        
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut des environnements:", error);
    return { error: "Erreur lors de la mise à jour du statut des environnements" };
  }
}; 



 export const initDefaultValues = async () => {
  try {
      // Mise à jour de tous les environnements
      await prisma.psadm_env.updateMany({ data: { statenvId: 8 }  });

      // Mise à jour de tous les environnements
      await prisma.envsharp.updateMany({ data: { statenvId: 8 } });

            
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
      console.error("Erreur lors des mises à jour des valeur par defaut !", error);
      return { error: "Erreur lors des mises à jour des valeur par defaut !" };
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
        { display: 3, level: 3, menu: 'DEVOPS 1', href: '', descr: 'Environnements DEVOPS 1', icone: 'workflow.png', active: 1, role: 'TMA_LOCAL' },
        { display: 4, level: 3, menu:  'DEVOPS 2', href: '', descr: 'Environnements DEVOPS 2', icone: 'share-2.png', active: 1, role: 'TMA_LOCAL'},
        { display: 5, level: 3, menu:  'DEVOPS FUSION', href: '', descr: 'Environnements DEVOPS Fusion', icone: 'git-merge.png', active: 1, role: 'TMA_LOCAL'},
        { display: 19, level: 3, menu:  'POC92', href: '', descr: 'Environnements POC 9.2', icone: 'wallet-cards.png', active: 1, role: 'TMA_LOCAL'},
        { display: 11, level: 3, menu:  'PRE-PRODUCTION', href: '', descr: '', icone: 'ferris-wheel.png', active: 1, role: 'TMA_LOCAL'},
        { display: 12, level: 3, menu:  'PRODUCTION', href: '', descr: 'Environnements de production HARP', icone: 'server-cog.png', active: 1, role: 'TMA_LOCAL'},
        { display: 16, level: 3, menu:  'PSADMIN', href: '', descr: '', icone: 'speech.png', active: 1, role: 'TMA_LOCAL'},
        { display: 21, level: 3, menu:  'PUM-MAINTENANCE PS', href: '', descr: 'Maintenance Peoplesoft', icone: 'puzzle.png', active: 1, role: 'TMA_LOCAL'},
        { display: 9,  level: 3, menu:  'QUALIFICATION', href: '', descr: 'Environnements de qualification HARP', icone: 'shieldcheck.png', active: 1, role: 'TMA_LOCAL'},
        { display: 10, level: 3, menu:  'RECETTE', href: '', descr: 'Environnements de recette HARP', icone: 'concierge-bell.png', active: 1, role: 'TMA_LOCAL'},
        { display: 15, level: 3, menu:  'REFERENCE LIVRAISON', href: '', descr: '', icone: 'truck.png', active: 1, role: 'TMA_LOCAL'},
        { display: 13, level: 3, menu:  'SECOURS - DRP', href: '', descr: 'Environnements de secours DRP', icone: 'server-off.png', active: 1, role: 'TMA_LOCAL'},
        { display: 8, level: 3, menu:  'TMA', href: '', descr: 'Environnements DEVOPS', icone: 'dessert.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 1, menu:  'Accueil', href: '/home', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 11, level: 1, menu:  'Administration', href: '/admin', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
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
        { display: 7, level: 1, menu:  'Refresh Infos', href: '', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles', href: '/list/roles', descr: '', icone: '',active:  1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles serveurs', href: '/list/servrole', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Rôles Utilisateurs', href: '/list/useroles', descr: '', icone: 'flag.png', active: 1, role: 'TMA_LOCAL'},
        { display: 3, level: 1, menu:  'Self-service', href: '', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Serveurs', href: '/list/servers', descr: '', icone: 'server.png', active: 1, role: 'TMA_LOCAL'},
        { display: 8, level: 1, menu:  'Statacm', href: 'http://statacm.adsaft.ft.net:8080', descr: '', icone: '', active: 1, role: 'TMA_LOCAL'},
        { display: 0, level: 2, menu:  'Statut env.', href: '/list/statenv', descr: '', icone: 'shieldcheck.png', active: 1, role: 'TMA_LOCAL'},
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
    console.error("Erreur lors de la génération des menus :", error);
    return { error: "Erreur lors de la génération des menus !" };
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
      { typenv: "REFERENCE LIVRAISON" }
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
    console.error("Erreur lors de la liaison des environnements aux menus :", error);
    return { error: "Erreur lors de la mise à jour des environnements" };
  }
}; 


 

// export const lierTypeEnvs = async () => {
//   try {
//     // Récupérer d'abord tous les types d'environnement
//     const typenvs = await prisma.psadm_typenv.findMany({
//       select: {
//         typenv: true,
//         display: true
//       }
//     });

//     // Créer un map pour un accès plus rapide
//     const typenvMap = new Map(
//       typenvs.map(item => [item.typenv, item.display])
//     );

//     // Effectuer les mises à jour en batch
//     const updates = await prisma.$transaction(
//       [
//         "PSADMIN",
//         "TMA",
//         "DEVOPS 1",
//         "DEVOPS 2",
//         "PUM-MAINTENANCE PS",
//         "SECOURS - DRP",
//         "DEVELOPPEMENT PROJET",
//         "DEVOPS FUSION",
//         "DEVELOPPEMENT HOTFIX",
//         "POC92",
//         "PRE-PRODUCTION",
//         "PRODUCTION",
//         "RECETTE",
//         "QUALIFICATION",
//         "REFERENCE LIVRAISON",
//       ].map(typenv => {
//         const display = typenvMap.get(typenv);
//         if (!display) {
//           console.warn(`Type d'environnement non trouvé: ${typenv}`);
//           return null;
//         }
        
//         return prisma.psadm_env.updateMany({
//           where: { typenv },
//           data: { typenvid: display }
//         });
//       }).filter(Boolean)
//     );

//     const totalUpdated = updates.reduce((sum, result) => sum + (result?.count || 0), 0);
    
//     return { 
//       success: `Les environnements ont été liés aux menus avec succès (${totalUpdated} mises à jour)!`
//     };
//   } catch (error) {
//     console.error("Erreur lors de la liaison des environnements aux menus :", error);
//     return { 
//       error: "Erreur lors de la mise à jour des environnements",
//       details: error instanceof Error ? error.message : "Erreur inconnue"
//     };
//   }
// };

 

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
        { typenv: "REFERENCE LIVRAISON" }
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
      console.error("Erreur lors de la mise à jour des typenvid:", error);
      return { error: "Erreur lors de la mise à jour des typenvid" };
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
    console.error("Erreur lors de l'importation :", error);
    return { error: "Erreur lors de l'importation des rôles" };
  }
};
 

// export async function importListEnvs ()  {
//   try {
      
//      // Vérifier si la table est vide
//      const count = await prisma.envsharp.count();
    
//      if (count > 0) {
//        return { info: "La table envsharp contient déjà tous les environnements Harp. Importation ignorée." };
//      }

//      // Réinitialiser l'auto-increment
//     await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

//     // Récupérer les données de psadm_env
//     const envData = await prisma.psadm_env.findMany();
    
//     // Insérer les données dans envsharp
//     const result = await prisma.envsharp.createMany({
//       data: envData.map(record => ({
//           // display: record.display,
//           env: record.env,
//           //site: record.site,
//           // typenv: record.typenv,
//           url: record.url,
//           // oracle_sid: record.oracle_sid,
//           // aliasql: record.aliasql,
//           // oraschema: record.oraschema,
//           appli: record.appli,
//           psversion: record.psversion,
//           ptversion: record.ptversion,
//           harprelease: record.harprelease,
//           volum: record.volum,
//           datmaj: record.datmaj,
//           gassi: record.gassi,
//           rpg: record.rpg,
//           msg: record.msg,
//           descr: record.descr,
//           anonym: record.anonym,
//           edi: record.edi,
//           typenvid: record.typenvid,
//           statenvId: record.statenvId
//         }))
//     });

//     return { success: `${result.count} environnements Harp importé pour Prisma avec succès !` };
//     } catch (error) {
//     console.error("Erreur l'importation des environnements Harp pour Prisma:", error);
//     return { error: "Erreur l'importation des environnements Harp pour Prisma" };
// }

// };

 

export async function importListEnvs() {
  try {
    // Vérifier si la table est vide
    const count = await prisma.envsharp.count();
    
    if (count > 0) {
      return { info: "La table envsharp contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE envsharp AUTO_INCREMENT = 1`;

    // Récupérer les données de psadm_env
    const envData = await prisma.psadm_env.findMany({
      where: {
        env: { not: null } // S'assurer que env n'est pas null
      }
    });

    if (!envData.length) {
      return { warning: "Aucune donnée trouvée dans psadm_env" };
    }

    // Insérer les données dans envsharp
    const result = await prisma.envsharp.createMany({
      data: envData.map(record => ({
        env: record.env,
        url: record.url || null,
        appli: record.appli || null,
        psversion: record.psversion || null,
        ptversion: record.ptversion || null,
        harprelease: record.harprelease || null,
        volum: record.volum || null,
        datmaj: record.datmaj || new Date(),
        gassi: record.gassi || false,
        rpg: record.rpg || false,
        msg: record.msg || null,
        descr: record.descr || null,
        anonym: record.anonym || false,
        edi: record.edi || false,
        typenvid: record.typenvid || null,
        statenvId: record.statenvId || null
      })),
      skipDuplicates: true
    });

    return { 
      success: `${result.count} environnements Harp importés avec succès !`,
      details: {
        totalProcessed: envData.length,
        imported: result.count
      }
    };

  } catch (error) {
    console.error("Erreur lors de l'importation des environnements Harp:", error);
    return { 
      error: "Erreur lors de l'importation des environnements Harp",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}



export const importInstanceOra = async () => {
  try {

     // Vérifier si la table envsharp contient des données
    const countEnvsharp = await prisma.envsharp.count();
    
    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }
   
     // Vérifier si la table est vide
     const count = await prisma.harpora.count();
    
     if (count > 0) {
       return { info: "La table harpora contient déjà toutes les instances d'environnements. Importation ignorée." };
     }

     // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;


    // Récupérer les données depuis les tables existantes
    

    // Insérer les résultats dans la table harpora
    const importedData = await prisma.harpora.createMany({
      data: results.map((row: any) => ({
        envId: row.envId,
        oracle_sid: row.oracle_sid,
        aliasql: row.aliasql,
        oraschema: row.oraschema,
        descr: row.descr,
        orarelease: row.orarelease
      })),
      skipDuplicates: true // Ignore les doublons grâce à la contrainte @@unique
    });

    return { success: `${importedData.count} enregistrements importés avec succès !` };
  } catch (error) {
    console.error("Erreur lors de l'importation d'instances d'environnements:", error);
    return { error: "Erreur lors de l'importation  d'instances d'environnements." };
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

 

export const importerInstancesOracle = async () => {
  try {
    // Vérifier si la table envsharp contient des données
    const countEnvsharp = await prisma.envsharp.count();
    
    if (countEnvsharp === 0) {
      return { info: "La table envsharp est vide. Veuillez d'abord importer les environnements." };
    }
   
    // Vérifier si la table est vide
    const count = await prisma.harpora.count();
    
    if (count > 0) {
      return { info: "La table harpora contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;

    // Récupérer les données depuis les tables existantes
    const results = await prisma.$queryRaw`
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

    // Insérer les résultats dans la table harpora
    const importedData = await prisma.harpora.createMany({
      data: results.map((row: any) => ({
        envId: row.envId,
        oracle_sid: row.oracle_sid,
        aliasql: row.aliasql,
        oraschema: row.oraschema,
        descr: row.descr,
        orarelease: row.orarelease
      })),
      skipDuplicates: true // Ignore les doublons grâce à la contrainte @@unique
    });

    return { success: `${importedData.count} instances Oracle importées avec succès !` };
  } catch (error) {
    console.error("Erreur lors de l'importation des instances Oracle:", error);
    return { error: "Erreur lors de l'importation des instances Oracle" };
  }
};


export async function migrerLesUtilisateurs() {
  try {

     // Vérifier si la table est vide
     const count = await prisma.user.count();
    
     if (count > 0) {
       return { info: "La table user contient déjà tous les utilisateurs Harp. Importation ignorée." };
     }

      // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;

     // Récupérer tous les utilisateurs de psadm_user
    const psadmUsers = await prisma.psadm_user.findMany()
    
    console.log(`Migration de ${psadmUsers.length} utilisateurs...`)

    // Pour chaque utilisateur dans psadm_user
    for (const user of psadmUsers) {
      // Vérifier si l'utilisateur existe déjà dans la table User
      const existingUser = await prisma.user.findUnique({
        where: { netid: user.netid }
      })

      if (!existingUser) {
        // Créer le nouvel utilisateur dans la table User
        await prisma.User.create({
          data: {
            netid: user.netid,
            unxid: user.unxid,
            oprid: user.oprid,
            nom: user.nom,
            prenom: user.prenom,
            pkeyfile: user.pkeyfile,
            lastlogin: user.lastlogin,
            email: user.email,
            password: user.mdp,
             
          }
        })
        console.log(`Utilisateurs migré avec succès: ${user.netid}`)
      } else {
        console.log(`L'utilisateur ${user.netid} existe déjà`)
      }
    }
   
   // return { success: `${psadmUsers.count} utilisateurmigrer vers Prisma avec succès !` };
    return { success: `Les utilisateurs sont migrés vers Prisma avec succès !` };
  } catch (error) {
    console.error('Erreur lors de la migration des utilisateurs vers Prisma:', error)
    return { error: "Erreur lors de la migration des utilisateurs vers Prisma." };
  } finally {
    await prisma.$disconnect()
  }
};
 
export const migrerLesRolesUtilisateurs = async () => {
  try {

     // Vérifier si la table est vide
     const countuser = await prisma.user.count();
    
     if (countuser === 0) {
       return { info: "La table user est vide. Vous devez 'abord importer les utilisateurs. Importation ignorée." };
     }
    // Vérifier si la table est vide
    const count = await prisma.harpuseroles.count();
    
    if (count > 0) {
      return { info: "La table harpuseroles contient déjà des données. Importation ignorée." };
    }

    // Récupérer les données avec la requête fournie
    const results = await prisma.$queryRaw`
      SELECT u.id as userid, h.id as roleid, pr.datmaj 
      FROM User u, psadm_roleuser pr, harproles h  
      WHERE u.netid = pr.netid AND h.role = pr.role
    `;

    // Insérer les résultats dans harpuseroles
    const importedData = await prisma.harpuseroles.createMany({
      data: results.map((row: any) => ({
        userId: row.userid,
        roleId: row.roleid,
        datmaj: row.datmaj || new Date()
      }))
    });

    return { success: `${importedData.count} rôles d'utilisateurs migrés avec succès !` };
  } catch (error) {
    console.error("Erreur lors de la migration des rôles utilisateurs:", error);
    return { error: "Erreur lors de la migration des rôles utilisateurs" };
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
    console.error("Erreur lors de la vérification des doublons:", error);
    return { error: "Erreur lors de la vérification des doublons sur oracle_sid" };
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
    console.error("Erreur lors de la vérification des doublons:", error);
    return { error: "Erreur lors de la vérification des doublons sur oracle_sid" };
  }
};

 

export const importerLesPsoftVersions = async () => {
  try {
    // Vérifier si la table est vide
    const count = await prisma.psoftversion.count();
    
    if (count > 0) {
      return { info: "La table psoftversion contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE psoftversion AUTO_INCREMENT = 1`;

    // Récupérer les données de psadm_version
    const versions = await prisma.$queryRaw`
      SELECT psversion, ptversion, harprelease, descr 
      FROM psadm_version
    `;

    // Insérer les données dans psoftversion
    const result = await prisma.psoftversion.createMany({
      data: versions.map((version: any) => ({
        psversion: version.psversion,
        ptversion: version.ptversion,
        harprelease: version.harprelease,
        descr: version.descr
      })),
      skipDuplicates: true // Ignore les doublons grâce à la contrainte @@unique
    });

    return { success: `${result.count} versions PeopleSoft importées avec succès !` };
  } catch (error) {
    console.error("Erreur lors de l'importation des versions PeopleSoft:", error);
    return { error: "Erreur lors de l'importation des versions PeopleSoft" };
  }
}; 


export const migrateReleaseData = async () => {
  try {
    // Vérifier si la table de destination est vide
    const countReleaseEnv = await prisma.releaseenv.count();
    
    if (countReleaseEnv > 0) {
      return { info: "La table releaseenv contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment de la table de destination
    await prisma.$executeRaw`ALTER TABLE releaseenv AUTO_INCREMENT = 1`;

    // Récupérer les données source
    const releases = await prisma.psadm_release.findMany({
      select: {
        harprelease: true,
        descr: true,
      },
    });

    if (releases.length === 0) {
      return { info: "Aucune donnée à migrer depuis psadm_release." };
    }

    // Insérer les données dans releaseenv
    const result = await prisma.releaseenv.createMany({
      data: releases.map(release => ({
        harprelease: release.harprelease,
        descr: release.descr,
      }))
    });

    return { 
      success: `Migration réussie : ${result.count} versions Harp migrées avec succès !`
    };

  } catch (error) {
    console.error('Erreur lors de la migration des versions Harp:', error);
    return { 
      error: "Erreur lors de la migration des versions Harp" 
    };
  }
};


// ... existing code ...

export const importerLesTypesEnv = async () => {
  try {
    // Vérifier si la table est vide
    const count = await prisma.harptypenv.count();
    
    if (count > 0) {
      return { info: "La table harptypenv contient déjà des données. Importation ignorée." };
    }

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harptypenv AUTO_INCREMENT = 1`;

    // Récupérer les données de psadm_typenv
    const typenvData = await prisma.psadm_typenv.findMany({
      select: {
        display: true,
        typenv: true,
        descr: true
      }
    });

    // Insérer les données dans harptypenv
    await prisma.harptypenv.createMany({
      data: typenvData.map(record => ({
        typenv: record.typenv,
        href: `/list/envs/${record.display}`,  // Génération du href basé sur display
        descr: record.descr
      }))
    });

    return { success: "Les types d'environnement ont été importés avec succès !" };
  } catch (error) {
    console.error("Erreur lors de l'importation des types d'environnement:", error);
    return { error: "Erreur lors de l'importation des types d'environnement" };
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

    // Mettre à jour chaque environnement
    const updates = envs.map(async (env) => {
      const matchingRelease = releases.find(
        release => release.harprelease === env.harprelease
      );

      if (matchingRelease) {
        return prisma.envsharp.update({
          where: { id: env.id },
          data: { releaseId: matchingRelease.id }
        });
      }
    });

    const result = await Promise.all(updates.filter(Boolean));

    return { success: `${result.length} environnements mis à jour avec leur releaseId !` };

  } catch (error) {
    console.error("Erreur lors de la mise à jour des releaseId:", error);
    return { error: "Erreur lors de la mise à jour des releaseId de ENVSHARP" };
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
    console.error('Erreur lors de la migration:', error)
    return { error: "Erreur lors de l'import dans ENVSHARP" };
  // } finally {
  //   await prisma.$disconnect()
  }
};

// ... existing code ...

export const migrerLesUtilisateursNEW = async () => {
  try {
    // Vérifier si la table est vide
    const count = await prisma.user.count();
    
    if (count > 0) {
      return { info: "La table user contient déjà tous les utilisateurs Harp. Importation ignorée." };
    }

     // Réinitialiser l'auto-increment
     await prisma.$executeRaw`ALTER TABLE user AUTO_INCREMENT = 1`;

    // Récupérer tous les utilisateurs de psadm_user
    const psadmUsers = await prisma.psadm_user.findMany({
      select: {
        netid: true,
        unxid: true,
        oprid: true,
        nom: true,
        prenom: true,
        pkeyfile: true,
        lastlogin: true,
        email: true,
      }
    });

    // Pour chaque utilisateur dans psadm_user
    const createdUsers = await prisma.user.createMany({
      data: psadmUsers.map(user => ({
        netid: user.netid,
        unxid: user.unxid,
        oprid: user.oprid,
        nom: user.nom,
        prenom: user.prenom,
        pkeyfile: user.pkeyfile,
        lastlogin: user.lastlogin,
        email: user.email,
      })),
      skipDuplicates: true // Ignore les doublons basés sur les champs uniques (netid)
    });

    return { success: `${createdUsers.count} utilisateurs migrés vers Prisma avec succès !` };
  } catch (error) {
    console.error('Erreur lors de la migration des utilisateurs vers Prisma:', error);
    return { error: "Erreur lors de la migration des utilisateurs vers Prisma." };
  }
}

// ... existing code ...
