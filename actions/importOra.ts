
"use server";

import * as z from "zod";
import { HarpserSchema } from "@/schemas";
import prisma  from "@/lib/prisma";
import { toast } from "react-toastify";



export async function migratePsadmData ()  {
 
  try {

    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpora AUTO_INCREMENT = 1`;
      
    // Récupérer les données de psadm_oracle
    const psadmData = await prisma.psadm_oracle.findMany();
    
    // Insérer les données dans harpora
    await prisma.harpora.createMany({
      data: psadmData.map(record => ({
        // id: crypto.randomUUID(),
        oracle_sid: record.oracle_sid,
        aliasql: record.aliasql,
        oraschema: record.oraschema,
        descr: record.descr,
        orarelease: record.orarelease,
        typenvid: record.typenvid
      }))
    });
    
    return { success: true, message: 'Migration réussie' };
    toast.success("Migration réussie !")
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    toast.error("Erreur lors de la migration dans harpora !");
    toast.error(error.message);
    return { success: false, message: 'Erreur lors de la migration' };
  }
   
};



export const majLesDates = async () => {
  try {
      // Mise à jour de tous les environnements
      // await prisma.psadm_env.updateMany({
      //     data: {
      //         statenvId: 8
      //     }
      // });

      //   // Mise à jour de tous les environnements
      //   await prisma.envsharp.updateMany({
      //     data: {
      //         statenvId: 8
      //     }
      // });

      // // Mise à jour des dernières connexions utilisateurs
      // await prisma.psadm_user.updateMany({
      //     where: {
      //         lastlogin: 0
      //     },
      //     data: {
      //         lastlogin: new Date()
      //     }
      // });

      // Mise à jour des dates de disponibilité
      // await prisma.psadm_dispo.updateMany({
      //     where: {
      //         fromdate: 0
      //     },
      //     data: {
      //         fromdate: new Date()
      //     }
      // });

      return { success: "Mises à jour effectuées avec succès !" };
  } catch (error) {
      console.error("Erreur lors des mises à jour :", error);
      return { error: "Erreur lors des mises à jour" };
  }
};


export const genererMenus = async () => {
  try {
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
        { display: 9,  level: 3, menu:  'QUALIFICATION', href: '', descr: 'Environnements de qualification HARP', icone: 'shield-check.png', active: 1, role: 'TMA_LOCAL'},
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

    return { success: "Menus importés avec succès !" };
  } catch (error) {
    console.error("Erreur lors de l'importation :", error);
    return { error: "Erreur lors de l'importation des menus" };
  }
};



export async function migrateMenusData ()  {
 
  try {
      
    // Récupérer les données de psadm_typenv
    const psadmData = await prisma.psadm_typenv.findMany();
    
    // Insérer les données dans harpmenus
    await prisma.harpmenus.createMany({
      data: psadmData.map(record => ({
          display: record.display, 
          level: 3,
          menu: record.typenv,
          descr: record.descr,
          active: 1,
        }))
      });
      
      return { success: true, message: 'Migration réussie' };
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      return { success: false, message: 'Erreur lors de la migration' };
    }
   
  };







  export async function migrateMenuDashData ()  {
 
    try {
        
      // Récupérer les données de psadm_typenv
      const psadmData = await prisma.psadm_tab.findMany();
      
      // Insérer les données dans harpmenus
      await prisma.harpmenus.createMany({
      data: 
        psadmData.map(record => ({
            display: record.display,
            level: record.level,
            menu: record.tab,
            href: record.newhref,
            descr: "",
            icone: "",
          }))
        });
        
        return { success: true, message: 'Migration réussie' };
      } catch (error) {
        console.error('Erreur lors de la migration:', error);
        return { success: false, message: 'Erreur lors de la migration' };
      }
     
    };





    export const majTypeEnvs = async () => {
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
          await prisma.psadm_env.update({
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
    
        return { success: "Mise à jour effectuée avec succès !" };
      } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        return { error: "Erreur lors de la mise à jour des environnements" };
      }
    };    


   
  export const majTypeEnvsHarp = async () => {
      try {
        const typeEnvs = [
          "PSADMIN", "TMA", "DEVOPS 1", "DEVOPS 2", "PUM-MAINTENANCE PS",
          "SECOURS - DRP", "DEVELOPPEMENT PROJET", "DEVOPS FUSION",
          "DEVELOPPEMENT HOTFIX", "POC92", "PRE-PRODUCTION", "PRODUCTION",
          "RECETTE", "QUALIFICATION", "REFERENCE LIVRAISON"
        ];
    
        await Promise.all(typeEnvs.map(async (typenv) => {
          const typeEnvData = await prisma.psadm_typenv.findUnique({
            where: { typenv },
            select: { display: true }
          });
    
          return prisma.envsharp.update({
            where: { typenv },
            data: { typenvid: typeEnvData?.display }
          });
        }));
    
        return { success: "Mise à jour effectuée avec succès !" };
      } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        return { error: "Erreur lors de la mise à jour des environnements" };
      }
    };       



export async function importLiensEnvs ()  {
 
  try {
      
    // Récupérer les données de psadm_env
    const envData = await prisma.psadm_env.findMany();
    
    // Insérer les données dans envsharp
    await prisma.envsharp.createMany({
      data: envData.map(record => ({
          display: record.display,
          env: record.env,
          site: record.site,
          typenv: record.typenv,
          url: record.url,
          oracle_sid: record.oracle_sid,
          aliasql: record.aliasql,
          oraschema: record.oraschema,
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
    });

    return { success: true, message: 'Migration réussie' };
    } catch (error) {
    console.error('Erreur lors de la migration:', error);
    return { success: false, message: 'Erreur lors de la migration' };
}

};


export async function migratePsUsertoPrisma ()  {
  
  try {
      
    // Récupérer les données de psadm_oracle
    const psadmData = await prisma.psadm_user.findMany();
    
    // Insérer les données dans harpora
    await prisma.user.createMany({
      data: psadmData.map(record => ({
        // id: crypto.randomUUID(), 
        netid: record.netid,
        unxid: record.unxid,
        oprid: record.oprid,
        nom: record.nom,
        prenom: record.prenom,
        pkeyfile: record.pkeyfile,
        expunx: record.expunx,
        expora: record.expora,
        lastlogin: record.lastlogin
       }))
    });
    
    return { success: true, message: 'Migration réussie' };
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    return { success: false, message: 'Erreur lors de la migration',  error };
  }
   
};


export const importEnvsToHarpora = async () => {
  try {
    // Récupération des données avec Prisma
    const harpData = await prisma.envsharp.findMany({
      include: {
        psadm_oracle: {
          where: {
            aliasql: {
              equals: prisma.envsharp.fields.env
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Transformation et insertion des données
    const insertPromises = harpData.map(async (env) => {
      return prisma.harpora.create({
        data: {
          envId: env.id,
          oracle_sid: env.oracle_sid, 
          aliasql: env.aliasql,
          oraschema: env.oraschema,
          orarelease: env,

          oracle_sid: env.psadm_oracle[0]?.oracle_sid,
          aliasql: env.psadm_oracle[0]?.aliasql,
          oraschema: env.psadm_oracle[0]?.oraschema,
          descr: env.psadm_oracle[0]?.descr,
          orarelease: env.psadm_oracle[0]?.orarelease
        }
      });
    });

    await Promise.all(insertPromises);
    
    return { success: "Données importées avec succès !" };
  } catch (error) {
    console.error("Erreur lors de l'importation :", error);
    return { error: "Erreur lors de l'importation des données" };
  }
};

 
  export const insertIntoHarpora = async () => {
    try {
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
  
      return { success: `${importedData.count} enregistrements importés avec succès !` };
    } catch (error) {
      console.error("Erreur lors de l'importation :", error);
      return { error: "Erreur lors de l'importation des données." };
    }
  };






export async function migrateUsers() {
  try {
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
        await prisma.user.create({
          data: {
            netid: user.netid,
            unxid: user.unxid,
            oprid: user.oprid,
            nom: user.nom,
            prenom: user.prenom,
            pkeyfile: user.pkeyfile,
            lastlogin: user.lastlogin,
            email: user.email,
            defpage: user.defpage
          }
        })
        console.log(`Utilisateur migré avec succès: ${user.netid}`)
      } else {
        console.log(`L'utilisateur ${user.netid} existe déjà`)
      }
    }

    console.log('Migration terminée avec succès')
  } catch (error) {
    console.error('Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
};


export const importerStatutenv = async () => {
  try {

     // Vérifier si la table est vide
     const count = await prisma.statutenv.count();
    
     if (count > 0) {
       toast.info("La table statutenv contient déjà des données. Importation ignorée.");
       return { info: "La table statutenv contient déjà des données. Importation ignorée." };
     }


    // Réinitialiser l'auto-increment
    await prisma.$executeRaw`ALTER TABLE harpmenus AUTO_INCREMENT = 1`;
    
    // Création des statuts d'environnement
    await prisma.statutenv.createMany({
      data: [
        { statenv: 'ANONYMISE', descr: 'Données anonymisées', display: null, icone: 'anonym.png' },
        { statenv: 'BASE_ONLY', descr: 'Accès uniquement à la base de données', display: null, icone: 'base_only.png' },
        { statenv: 'DECOMMISSION', descr: 'Environnement à Décommissionner', display: null, icone: 'decommission.png' },
        { statenv: 'DUMMY', descr: 'Divers', display: null, icone: 'special.png' },
        { statenv: 'FERME', descr: 'Evironnement indisponible', display: null, icone: 'ferme.png' },
        { statenv: 'INVISIBLE', descr: 'Invisible', display: null, icone: 'invisible.png' },
        { statenv: 'OBSOLETE', descr: 'Environnement obsolète', display: null, icone: 'obsolete.png' },
        { statenv: 'OUVERT',  descr: 'Environnement disponible', display: null, icone: 'ouvert.png' },
        { statenv: 'REFRESH', descr: 'Environnement en cours de rafraichissement', display: null, icone: 'refresh.png' },
        { statenv: 'RESTREINT', descr: 'Accès reservé à certains utilisateurs', display: null, icone: 'restreint.png' }
      ]
    });

    toast.success("Les statuts d'environnement ont été importés avec succès !") ;
    return { success: "Les statuts d'environnement ont été importés avec succès !" };
  } catch (error) {
    // toast.error("Erreur lors de l'importation des statuts d'environnement !");
    return { error: "HUBERT IMPORT ORA < Erreur lors de l'importation des statuts d'environnement" };
  }

  
};

// {
//   const result = await importerStatutenv();
//   if (result.error) {
//     toast.error(result.error);
//   } else if (result.success) {
//     toast.success(result.success);
//   }

// }



export const updateStatenvIds = async () => {
  try {
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

    await Promise.all(updates.filter(Boolean));
    return { success: "Mise à jour des statenvId effectuée avec succès" };
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    return { error: "Erreur lors de la mise à jour des statenvId" };
  }
};



export const instanceTypeEnvId = async () => {
  const aliasGroups = {
    3: ["FHXD113", "FHXD105", "FHXI107", "FHXD114", "FHXD106", "FHXI108", "FHXD115", "FHXI101", /* ... */],
    4: ["FHXD210", "FHXI203", "FHXD202", "FHXD218", "FHXI2R1", /* ... */],
    5: ["FHXF2R1", "FHXF2R2", "FHXF1R1", "FHXF1R2"],
    6: ["FHXQL9", "FHXQLA", "FHXIT9", "FHXDV9", "FHXQPA"],
    7: ["FHXMHP"],
    8: ["FHXCI2", "FHXCQ1", "FHXCR1", "FHXCR2", "FHXCD1", "FHXCD2", "FHXCI1"],
    9: ["FHXQL1", "FHXVA1", "FHXQL2", "FHFQLR", "FHXVA2", /* ... */],
    10: ["FHHRE1", "FHFPP4", "FHHRE2", "FHFPP5", "FHHRE3", /* ... */],
    11: ["FHHPP1", "FHFPP1"],
    12: ["FHFPP3", "FHFPR1", "FHHPP2", "FHHPP3", "FHXVIV", "FHHPR1", "FHFPP2"],
    13: ["FHHPP2", "FHHPR1"],
    15: ["FHXRF1", "FHXRFP"],
    16: ["FHXBC1", "FHXBC2"],
    19: ["FHXPO1", "FHXPO2"],
    21: ["FHXST3", "FHXDMO", "FHXST1", "FHXST2", "FHFPUM", "FHXPUM"]
  };

  try {
    for (const [typenvid, aliases] of Object.entries(aliasGroups)) {
      await prisma.psadm_oracle.updateMany({
        where: {
          aliasql: {
            in: aliases
          }
        },
        data: {
          typenvid: parseInt(typenvid)
        }
      });
    }
    
    return { success: "Mises à jour effectuées avec succès !" };
  } catch (error) {
    return { error: "Erreur lors des mises à jour" };
  }
};


export const importerHarproles = async () => {
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




export async function syncUserRoles(): Promise<void> {
  try {
    // Exécuter la requête pour obtenir les associations utilisateur-rôle
    const userRoleAssociations = await prisma.$queryRaw`
      SELECT u.id as userId, x.id as roleId 
      FROM User u
      JOIN psadm_user p ON p.netid = u.netid
      JOIN psadm_roleuser r ON p.netid = r.netid
      JOIN harproles x ON r.role = x.role
    `

// const result = await prisma.user.findMany({
//   select: {
//     id: true,
//   },
//   where: {
//     psadm_user: {
//       some: {
//         psadm_roleuser: {
//           some: {
//             harproles: {
//               select: {
//                 id: true,
//               },
//             },
//           },
//         },
//       },
//     },
//   },-1
// });





    // Supprimer les associations existantes pour éviter les doublons
    await prisma.harpuseroles.deleteMany({})

    // Insérer les nouvelles associations
    await prisma.harpuseroles.createMany({
      data: userRoleAssociations.map((association: { userId: number, roleId: number }) => ({
        userId: association.userId, 
        roleId: association.roleId
      }))
    })

    console.log('Synchronisation des rôles utilisateurs terminée avec succès')
  } catch (error) {
    console.error('Erreur lors de la synchronisation des rôles:', error)
    throw error
  }
};



const migrateUserRoles = async () => {
  const prisma = new PrismaClient();

  // Exécution de la requête raw SQL pour obtenir les associations
  const userRoles = await prisma.$queryRaw`
    SELECT u.id as userId, x.id as roleId 
    FROM User u, psadm_user p, psadm_roleuser r, harproles x 
    WHERE p.netid = u.netid 
    AND p.netid = r.netid 
    AND r.role = x.role
  `;

  // Insertion des résultats dans harpuseroles
  const insertPromises = userRoles.map((mapping: { userId: string, roleId: string }) => {
    return prisma.harpuseroles.create({
      data: {
        userId: mapping.userId,
        roleId: mapping.roleId
      }
    });
  });

  // Exécution des insertions en parallèle
  await Promise.all(insertPromises);

  await prisma.$disconnect();
};
 


export const migrerUserRoles = async () => {
  //const prisma = new PrismaClient();

  // Récupération des données avec une requête Prisma
  const userRoles = await prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      x.id as "roleId"
    FROM "User" u
    JOIN psadm_user p ON p.netid = u.netid
    JOIN psadm_roleuser r ON p.netid = r.netid
    JOIN harproles x ON r.role = x.role
  `;

  // Insertion des données dans harpuseroles
  const insertPromises = userRoles.map((mapping: { userId: string, roleId: string }) => {
    return prisma.harpuseroles.create({
      data: {
        userId: mapping.userId,
        roleId: mapping.roleId
      }
    });
  });

  // Exécution des insertions en parallèle
  await Promise.all(insertPromises);

  await prisma.$disconnect();
};