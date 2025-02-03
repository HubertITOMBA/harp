"use client";

import { GenererLesMenus, importerLesStatus, initDefaultValues, importerLesHarproles, 
 // importInstanceOra, 
  importListEnvs, 
  lierTypeEnvs, updateDispoEnvIds, migrerLesUtilisateurs, migrerLesRolesUtilisateurs, verifierDoublonsOracleSid, importerLesPsoftVersions, migrateReleaseData, importerLesTypesEnv, updateReleaseEnvIds, 
  migrateDataToEnvsharp,
  lierEnvauTypeEnv,
  migrerLesUtilisateursNEW,
  importerInstancesOracle,
  importInstanceOra} from "@/actions/importharp";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button"
import VerifierDoublons from '@/components/harp/VerifierDoublons';

  const handlestatutEnv = async () => {
    try {
      const result = await importerLesStatus();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      } else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation");
    }
  };

 const handleDefaultValues = async () => {
    try {
      const result = await initDefaultValues();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation");
    }
  };

  const handleGenererMenus = async () => {
    try {
      const result = await GenererLesMenus();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de le génération des Menus !");
    }
  };


  const handleLinksEnv = async () => {
    try {
      //const result = await lierTypeEnvs()
      const result = await lierEnvauTypeEnv();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
      //  else if (result.info) {
      //   toast.info(result.info);
      // }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la liaison des environnements aux menus !");
    }
  };


  const handleImportRoles = async () => {
    try {
      const result = await importerLesHarproles();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de le génération des Menus !");
    }
  };

  const handleEnvsHarp = async () => {
    try {
      const result = await importListEnvs();
     // const result = await migrateDataToEnvsharp();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation des environnements Harp pour Prisma !");
    }
  };

  const handeleInstancesEnvs = async () => {
    try {
      const result = await importInstanceOra();
      //const result = await importerInstancesOracle();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation d'instance d'environnement !");
    }
  };


  const handleStatutDisponible = async () => {
    try {
      const result = await updateDispoEnvIds();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation d'instance d'environnement !");
    }
  };


  const handleImportUsers = async () => {
    try {
     // const result = await migrerLesUtilisateurs();
      const result = await migrerLesUtilisateursNEW();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation des utilisateurs !");
    }
  };

 
  const handleRoleUsers = async () => {
    try {
      const result = await migrerLesRolesUtilisateurs();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
       }
       else if (result.info) {
        toast.info(result.info);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'importation de rôles d'utilisateurs !");
    }
  }

  
//   const result = await verifierDoublonsOracleSid();
// if (result.details) {
//   console.log(`Nombre de oracle_sid en doublon : ${result.details.length}`);
//   result.details.forEach(doublon => {
//     console.log(`\nOracle SID ${doublon.oracle_sid} (${doublon.occurrences} occurrences):`);
//     doublon.environnements.forEach(env => {
//       console.log(`- Env: ${env.env}, Alias: ${env.aliasql}, Schema: ${env.oraschema}`);
//     });
//   });
// }



const handlePsoft = async () => {
  try {
    const result =  await importerLesPsoftVersions();
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
     }
     else if (result.info) {
      toast.info(result.info);
    }
  } catch (error) {
    toast.error("Une erreur est survenue lors de l'importation de version PeopleSoft !");
  }
} 

const handleRelease = async () => {
  try {
    const result = await migrateReleaseData();
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
     }
     else if (result.info) {
      toast.info(result.info);
    }
  } catch (error) {
    toast.error("Une erreur est survenue lors de l'importation de Harp Release !");
  }
}


const handleTypeEnvs = async () => {
  try {
    const result = await importerLesTypesEnv();
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
     }
     else if (result.info) {
      toast.info(result.info);
    }
  } catch (error) {
    toast.error("Une erreur est survenue lors de l'importation liens pour les types d'environnements !");
  }
}

const handleRealeseEnv = async () => {
  try {
    const result = await updateReleaseEnvIds();
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
     }
     else if (result.info) {
      toast.info(result.info);
    }
  } catch (error) {
    toast.error("Une erreur est survenue lors de la mise à jour des releaseId de ENVSHARP !");
  }
}
 

 //=============================================   
export default function Home() {
  return (
    <main className="container w-full bg-transarent">
        
           <div className="flex-2  w-ful">
              <div className="flex gap-4">

               <div className="w-1/4 flex-1 flex-row  p-4 items-center gap-8">
                     <div>
                      <Button 
                              onClick={handleDefaultValues}
                              variant="default"
                              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                        >
                            1 - Ajuster les valeurs nulles
                        </Button>
                      </div>
                      <div>
                        <Button 
                                onClick={handleGenererMenus}
                                variant="default"
                                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                          >
                              2 - Generer les Menus
                          </Button>
                      </div>
                      <div>
                          <Button 
                              onClick={handlestatutEnv}
                              variant="default"
                              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                        >
                          10 - Importer les statuts d'environnement
                        </Button>
                        </div>
                        <div>
                            <Button 
                                    onClick={handlePsoft}
                                    variant="default"
                                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                              >
                                    7 - Importer les versions PeopleSoft
                              </Button>  
                        </div> 
                        <div>
                              <Button 
                                  onClick={handleRelease}
                                  variant="default"
                                  className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                            >
                              9 - Importer les Harp Release
                            </Button>
                        </div>  
                        <div>
                            <Button 
                                    onClick={handleTypeEnvs}
                                    variant="default"
                                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                              >
                                    8 - Importer les liens de types d'environnements
                              </Button>  
                        </div>
                    
                     <div>
                    
                     <Button 
                            onClick={handleLinksEnv}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                          3- Lier les Envs au Types d'environnement
                      </Button>
                     </div>

                       
                     <div>
                     <Button 
                            onClick={handleImportRoles}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                           4- Importer les roles
                      </Button>
                     </div>
                     
                     <div>
                     <Button 
                            onClick={handleEnvsHarp}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                           5- Generer les Liens des Envs pour PRISMA
                      </Button>  
                     </div>
                     <div>
                     <Button 
                            onClick={handeleInstancesEnvs}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                            6 - Importer les instances d'environnements
                      </Button>  
                     </div>

                    

                    

                  </div>
                  
                  
                    <div className="w-1/6 flex-1 p-4 items-center gap-8">
                    
                       
                        <div>
                        <Button 
                            onClick={handleStatutDisponible}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                        11 - Statut de Disponibilités d'environnements 
                      </Button>
                      </div>                  
                      <div>
                      <Button 
                            onClick={handleImportUsers}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                        12 -  Migrer les utilisateurs vers PRISMA 
                      </Button>
                      </div>
                      <div>
                      <Button 
                            onClick={handleImportUsers}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                        13 -  Importer Utilisateurs 
                      </Button>
                      </div>
                      <div>
                      <Button 
                            onClick={handleRoleUsers}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                        14 - Importer les roles Utilisateurs 
                      </Button>
                      </div>

                      <div>
                      <Button 
                            onClick={handleRealeseEnv}
                            variant="default"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 mb-5"
                      >
                        15 - Lier les Environnement aux Harp releases 
                      </Button>
                      </div>

                   
                        

                      <div>
                      <h1 className="text-2xl mb-4">Vérification des doublons Oracle SID</h1>
                      <VerifierDoublons />
                      </div>


                      
  
                  </div>
                </div>
           </div>
        
    </main>
  );
};


