"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeRefreshInfo, updateEnvFromFiles } from "@/actions/refresh-info";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Database, FileText, Server } from "lucide-react";
import { toast } from "react-toastify";

export default function RefreshInfoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUpdating, startUpdating] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  
  // États pour la progression de la mise à jour
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateMessage, setUpdateMessage] = useState("");
  const [currentServer, setCurrentServer] = useState("");
  
  // États pour la progression de l'exécution du script
  const [executeProgress, setExecuteProgress] = useState(0);
  const [executeMessage, setExecuteMessage] = useState("");

  const handleExecute = () => {
    setResult(null);
    setExecuteProgress(0);
    setExecuteMessage("Initialisation...");
    
    startTransition(async () => {
      // Simuler une progression pendant l'exécution
      const progressInterval = setInterval(() => {
        setExecuteProgress(prev => {
          if (prev >= 95) return prev; // Ne pas dépasser 95% avant la fin
          // Progression plus lente au début, puis accélération
          const increment = prev < 40 ? 0.3 : prev < 80 ? 0.8 : 1.5;
          return Math.min(prev + increment, 95);
        });
      }, 400);

      // Messages de progression simulés
      const messageInterval = setInterval(() => {
        const messages = [
          "Connexion au serveur...",
          "Exécution du script refresh_info.ksh...",
          "Récupération des informations...",
          "Traitement des données...",
          "Finalisation...",
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setExecuteMessage(randomMessage);
      }, 2500);

      try {
        const executionResult = await executeRefreshInfo();
        
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setExecuteProgress(100);
        setExecuteMessage("Terminé !");
        setResult(executionResult);
        
        if (executionResult.success) {
          toast.success(executionResult.message || "Script exécuté avec succès");
        } else {
          toast.error(executionResult.error || "Erreur lors de l'exécution du script");
        }
        
        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setExecuteProgress(0);
          setExecuteMessage("");
        }, 3000);
      } catch (error) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setExecuteProgress(0);
        setExecuteMessage("Erreur");
        toast.error("Une erreur inattendue s'est produite");
      }
    });
  };

  const handleUpdateFromFiles = () => {
    setUpdateResult(null);
    setUpdateProgress(0);
    setUpdateMessage("Initialisation...");
    setCurrentServer("");
    
    startUpdating(async () => {
      // Simuler une progression pendant le traitement
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 95) return prev; // Ne pas dépasser 95% avant la fin
          // Progression plus lente au début, puis accélération
          const increment = prev < 30 ? 0.5 : prev < 70 ? 1 : 2;
          return Math.min(prev + increment, 95);
        });
      }, 300);

      // Messages de progression simulés
      const messageInterval = setInterval(() => {
        const messages = [
          "Connexion aux serveurs DB...",
          "Lecture des fichiers CSV...",
          "Traitement des environnements...",
          "Mise à jour de la base de données...",
          "Finalisation...",
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setUpdateMessage(randomMessage);
      }, 2000);

      try {
        const updateExecutionResult = await updateEnvFromFiles();
        
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setUpdateProgress(100);
        setUpdateMessage("Terminé !");
        setUpdateResult(updateExecutionResult);
        
        if (updateExecutionResult.success) {
          toast.success(updateExecutionResult.message || "Mise à jour des environnements réussie");
        } else {
          toast.error(updateExecutionResult.error || "Erreur lors de la mise à jour des environnements");
        }
        
        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setUpdateProgress(0);
          setUpdateMessage("");
          setCurrentServer("");
        }, 3000);
      } catch (error) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setUpdateProgress(0);
        setUpdateMessage("Erreur");
        toast.error("Une erreur inattendue s'est produite");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-4xl shadow-lg border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refresh Info
          </CardTitle>
          <CardDescription className="text-orange-100">
            Exécution du script refresh_info.ksh sur le serveur Linux
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Informations
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Le script sera exécuté par l&apos;utilisateur connecté</li>
                <li>Chemin du script : <code className="bg-blue-100 px-1 rounded">/data/exploit/harpadm/outils/scripts/refresh_info.ksh</code></li>
                <li>Fichier de log : <code className="bg-blue-100 px-1 rounded">/data/exploit/harpadm/outils/logs/portail_refresh_info.log</code></li>
                <li>Le script récupère les informations sur les environnements depuis chaque serveur</li>
              </ul>
            </div>

            {/* Barre de progression pour l'exécution du script */}
            {isPending && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                  <h3 className="text-sm font-semibold text-orange-900">
                    Exécution du script en cours...
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-orange-700">
                    <span className="flex items-center gap-2">
                      {executeMessage || "Traitement en cours..."}
                    </span>
                    <span className="font-semibold">{Math.round(executeProgress)}%</span>
                  </div>
                  <Progress value={executeProgress} className="h-2 bg-orange-100" />
                  <p className="text-xs text-orange-600 italic">
                    ⏳ Cette opération peut prendre plusieurs minutes. Veuillez patienter...
                  </p>
                </div>
              </div>
            )}

            {result && !isPending && (
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      result.success ? "text-green-900" : "text-red-900"
                    }`}>
                      {result.success ? "Succès" : "Erreur"}
                    </h4>
                    <p className={`text-sm ${
                      result.success ? "text-green-800" : "text-red-800"
                    }`}>
                      {result.success ? result.message : result.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Barre de progression pour la mise à jour */}
            {isUpdating && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Mise à jour des environnements en cours...
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-700">
                    <span className="flex items-center gap-2">
                      {currentServer && (
                        <>
                          <Server className="h-3 w-3" />
                          <span className="font-medium">{currentServer}</span>
                        </>
                      )}
                      {!currentServer && updateMessage}
                    </span>
                    <span className="font-semibold">{Math.round(updateProgress)}%</span>
                  </div>
                  <Progress value={updateProgress} className="h-2 bg-blue-100" />
                  <p className="text-xs text-blue-600 italic">
                    ⏳ Cette opération peut prendre plusieurs minutes. Veuillez patienter...
                  </p>
                </div>
              </div>
            )}

            {updateResult && !isUpdating && (
              <div className={`p-4 rounded-lg border ${
                updateResult.success 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-start gap-3">
                  {updateResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      updateResult.success ? "text-green-900" : "text-red-900"
                    }`}>
                      {updateResult.success ? "Mise à jour réussie" : "Erreur de mise à jour"}
                    </h4>
                    <p className={`text-sm ${
                      updateResult.success ? "text-green-800" : "text-red-800"
                    }`}>
                      {updateResult.success ? updateResult.message : updateResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleExecute}
                disabled={isPending || isUpdating}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exécution en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Exécuter le script
                  </>
                )}
              </Button>
              <Button
                onClick={handleUpdateFromFiles}
                disabled={isPending || isUpdating}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Mettre à jour depuis les fichiers CSV
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push("/home")}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                disabled={isPending || isUpdating}
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

