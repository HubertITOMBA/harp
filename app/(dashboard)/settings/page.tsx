"use client";

import { useState } from "react";
import { GenererLesMenus, importerLesStatus, initDefaultValues, importerLesHarproles, 
 // importInstanceOra, 
  importListEnvs, 
  lierTypeEnvs, updateDispoEnvIds, migrerLesUtilisateurs, migrerLesRolesUtilisateurs, verifierDoublonsOracleSid, importerLesPsoftVersions, migrateReleaseData, importerLesTypesEnv, updateReleaseEnvIds, 
  migrateDataToEnvsharp,
  lierEnvauTypeEnv,
  migrerLesUtilisateursNEW,
  importerInstancesOracle,
  importInstanceOra,
  migrateServers,
  importerLesEnvInfos,
  importerOraInstances,
  updateInstanceServerIds,
  importerLesEnvServeurs,
  updateEnvsharpInstanceIds,
  updateEnvsharpOrarelease,
  importerLesPToolsVersions,
  importerLesEnvDispos,
  importerLesTools,
  importerLesMenuRoles,
  insertTypeBases,
  forceImportSpecificEnvs,
  importerLesMonitors} from "@/actions/importharp";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, Database, Server, Users, Package, RefreshCw, Link2, History, AlertTriangle, Wrench, Loader2 } from "lucide-react";
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
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
       }
       else if (result?.info) {
        toast.info(result.info);
      } else if (result?.warning) {
        toast.warning(result.warning);
      }
    } catch (error) {
      console.error("Erreur lors de l'appel de importListEnvs:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de l'importation des environnements Harp pour Prisma !";
      toast.error(errorMessage);
    }
  };

  const handleForceImportSpecificEnvs = async () => {
    try {
      const result = await forceImportSpecificEnvs();
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
        // Afficher les détails si disponibles
        if (result.details) {
          console.log("Détails de l'import forcé:", result.details);
        }
      } else if (result?.info) {
        toast.info(result.info);
      } else if (result?.warning) {
        toast.warning(result.warning);
      }
    } catch (error) {
      console.error("Erreur lors de l'appel de forceImportSpecificEnvs:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de l'import forcé des environnements spécifiques !";
      toast.error(errorMessage);
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
      // Utiliser migrerLesUtilisateurs() pour forcer l'import même si la table n'est pas vide
      const result = await migrerLesUtilisateurs();
     // const result = await migrerLesUtilisateursNEW();
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


const handlePTools = async () => {
  try {
    const result =  await importerLesPToolsVersions();
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
     }
     else if (result.info) {
      toast.info(result.info);
    }
  } catch (error) {
    toast.error("Une erreur est survenue lors de l'importation de version PeopleTools !");
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
 

const handleImporterHarpServe = async () => {
  try {
    const result = await migrateServers();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}

const handleImportHistoEnvs = async () => {
  try {
    const result = await  importerLesEnvInfos();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}



const handleImportINSTANCES = async () => {
  try {
    const result = await  importerOraInstances();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}


const handleMAjINSTANCES = async () => {
  try {
    const result = await  updateInstanceServerIds();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}



const handleLesEnvServeurs = async () => {
  try {
    const result = await  importerLesEnvServeurs();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}


const handleMAjInstance_ID_ENVS = async () => {
  try {
    const result = await  updateEnvsharpInstanceIds();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}

const handleOraRelease = async () => {
  try {
    const result = await  updateEnvsharpOrarelease();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de la mise à jour des HARPSERVE !");
}
}



const handleLesEnvDispos = async () => {
  try {
    const result = await  importerLesEnvDispos();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de l'import des indisponibilités !");
}
}



const handleLesTools = async () => {
  try {

const result = await  importerLesTools();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de l'import des indisponibilités !");
}
}


const handleLesTypeBases = async () => {
  try {
    const result = await  insertTypeBases();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de l'import des indisponibilités !");
}
}

const handleLesMenuRole = async () => {
  try {
    const result = await  importerLesMenuRoles();
if (result.error) {
  toast.error(result.error);
} else if (result.success) {
  toast.success(result.success);
 }
 else if (result.info) {
  toast.info(result.info);
}
} catch (error) {
toast.error("Une erreur est survenue lors de l'import des indisponibilités !");
}
}

 //=============================================   
export default function Home() {
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(false);
  const [monitorsProgress, setMonitorsProgress] = useState(0);
  const [monitorsMessage, setMonitorsMessage] = useState("");

  const handleLesMonitors = async () => {
    setIsLoadingMonitors(true);
    setMonitorsProgress(0);
    setMonitorsMessage("Démarrage de l'import...");
    
    try {
      // Simuler une progression pendant l'import
      const progressInterval = setInterval(() => {
        setMonitorsProgress(prev => {
          if (prev >= 90) return prev; // Ne pas dépasser 90% avant la fin
          return prev + Math.random() * 5; // Progression aléatoire entre 0 et 5%
        });
      }, 500);

      const result = await importerLesMonitors();
      
      clearInterval(progressInterval);
      setMonitorsProgress(100);
      
      if (result.error) {
        setMonitorsMessage("Erreur lors de l'import");
        toast.error(result.error);
      } else if (result.success) {
        setMonitorsMessage("Import terminé avec succès !");
        toast.success(result.success);
        // Afficher les détails si disponibles
        if (result.details) {
          const details = result.details;
          const detailMsg = `Importé: ${details.imported || 0}, Ignoré: ${details.ignoredRecords || 0} enregistrement(s) pour ${details.ignoredEnvironments || 0} environnement(s)`;
          setTimeout(() => toast.info(detailMsg), 1000);
        }
      } else if (result.info) {
        setMonitorsMessage("Aucune donnée à importer");
        toast.info(result.info);
      } else if (result.warning) {
        setMonitorsMessage("Import partiel");
        toast.warning(result.warning);
      }
      
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setMonitorsProgress(0);
        setMonitorsMessage("");
      }, 2000);
    } catch (error) {
      setMonitorsProgress(0);
      setMonitorsMessage("Erreur");
      toast.error("Une erreur est survenue lors de l'import des données de monitoring !");
    } finally {
      setIsLoadingMonitors(false);
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Settings className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Paramètres et Importations
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              Gestion des données et configurations du système HARP
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Grid of action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Initialisation */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5 text-blue-600" />
                Initialisation
              </CardTitle>
              <CardDescription>Configuration initiale du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleDefaultValues}
                variant="outline"
                className="w-full justify-start"
              >
                Ajuster les valeurs nulles
              </Button>
              <Button 
                onClick={handleLesTypeBases}
                variant="outline"
                className="w-full justify-start"
              >
                Ajouter les types de bases
              </Button>
              <Button 
                onClick={handleGenererMenus}
                variant="outline"
                className="w-full justify-start"
              >
                Générer les Menus
              </Button>
            </CardContent>
          </Card>

          {/* Environnements */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Environnements
              </CardTitle>
              <CardDescription>Gestion des environnements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handlestatutEnv}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les statuts d&apos;environnement
              </Button>
              <Button 
                onClick={handleTypeEnvs}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les types d&apos;environnements
              </Button>
              <Button 
                onClick={handleLinksEnv}
                variant="outline"
                className="w-full justify-start"
              >
                Lier les Types d&apos;environnement
              </Button>
              <Button 
                onClick={handleEnvsHarp}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les environnements HARP
              </Button>
              <Button 
                onClick={handleForceImportSpecificEnvs}
                variant="outline"
                className="w-full justify-start border-orange-300 hover:bg-orange-50"
              >
                Forcer l&apos;import d&apos;environnements spécifiques
              </Button>
              <Button 
                onClick={handeleInstancesEnvs}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les instances d&apos;environnements
              </Button>
            </CardContent>
          </Card>

          {/* Versions */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-5 w-5 text-purple-600" />
                Versions
              </CardTitle>
              <CardDescription>Gestion des versions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handlePsoft}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les versions PeopleSoft
              </Button>
              <Button 
                onClick={handlePTools}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les versions PeopleTools
              </Button>
              <Button 
                onClick={handleRelease}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les Harp Release
              </Button>
              <Button 
                onClick={handleRealeseEnv}
                variant="outline"
                className="w-full justify-start"
              >
                Lier les Environnements aux Harp releases
              </Button>
            </CardContent>
          </Card>

          {/* Serveurs */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Server className="h-5 w-5 text-orange-600" />
                Serveurs
              </CardTitle>
              <CardDescription>Gestion des serveurs et instances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleImporterHarpServe}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les serveurs
              </Button>
              <Button 
                onClick={handleImportINSTANCES}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les ORACLE_SID
              </Button>
              <Button 
                onClick={handleMAjINSTANCES}
                variant="outline"
                className="w-full justify-start"
              >
                Mettre à jour les ORACLE_SID
              </Button>
              <Button 
                onClick={handleLesEnvServeurs}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les ENVS Serveurs
              </Button>
              <Button 
                onClick={handleMAjInstance_ID_ENVS}
                variant="outline"
                className="w-full justify-start"
              >
                Mettre à jour INSTANCES ID dans les ENVS Serveurs
              </Button>
              <Button 
                onClick={handleOraRelease}
                variant="outline"
                className="w-full justify-start"
              >
                Mettre à jour Version ORACLE sur les ENVS
              </Button>
            </CardContent>
          </Card>

          {/* Utilisateurs */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-indigo-600" />
                Utilisateurs
              </CardTitle>
              <CardDescription>Gestion des utilisateurs et rôles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleImportRoles}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les rôles
              </Button>
              <Button 
                onClick={handleImportUsers}
                variant="outline"
                className="w-full justify-start"
              >
                Migrer les utilisateurs vers PRISMA
              </Button>


              <Button 
                onClick={handleLesMenuRole}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les accès aux Menus
              </Button>
              <Button 
                onClick={handleRoleUsers}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les rôles Utilisateurs
              </Button>
            </CardContent>
          </Card>

          {/* Historique et Disponibilités */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <History className="h-5 w-5 text-amber-600" />
                Historique &amp; Disponibilités
              </CardTitle>
              <CardDescription>Gestion de l&apos;historique et des disponibilités</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleImportHistoEnvs}
                variant="outline"
                className="w-full justify-start"
              >
                Importer l&apos;historique d&apos;environnements
              </Button>
              <Button 
                onClick={handleStatutDisponible}
                variant="outline"
                className="w-full justify-start"
              >
                Mettre à jour les disponibilités
              </Button>
              <Button 
                onClick={handleLesEnvDispos}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les Indisponibilités d&apos;environnements
              </Button>
              <div className="space-y-2">
                <Button 
                  onClick={handleLesMonitors}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isLoadingMonitors}
                >
                  {isLoadingMonitors ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    "Importer les données de monitoring"
                  )}
                </Button>
                {isLoadingMonitors && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{monitorsMessage || "Traitement en cours..."}</span>
                      <span>{Math.round(monitorsProgress)}%</span>
                    </div>
                    <Progress value={monitorsProgress} className="h-2" />
                    <p className="text-xs text-slate-500 italic">
                      Cette opération peut prendre plusieurs minutes en raison du volume de données...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Outils */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Wrench className="h-5 w-5 text-red-600" />
                Outils
              </CardTitle>
              <CardDescription>Gestion des outils système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleLesTools}
                variant="outline"
                className="w-full justify-start"
              >
                Importer les anciens chemins de tools
              </Button>
            </CardContent>
          </Card>

          {/* Vérifications */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Vérifications
              </CardTitle>
              <CardDescription>Outils de vérification des données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-sm font-medium mb-2">Vérifier doublons SID</h3>
                <VerifierDoublons />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
