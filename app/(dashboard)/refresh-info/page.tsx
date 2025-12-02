"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeRefreshInfo } from "@/actions/refresh-info";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { toast } from "react-toastify";

export default function RefreshInfoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleExecute = () => {
    setResult(null);
    startTransition(async () => {
      const executionResult = await executeRefreshInfo();
      setResult(executionResult);
      
      if (executionResult.success) {
        toast.success(executionResult.message || "Script exécuté avec succès");
      } else {
        toast.error(executionResult.error || "Erreur lors de l'exécution du script");
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

            {result && (
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

            <div className="flex items-center gap-3">
              <Button
                onClick={handleExecute}
                disabled={isPending}
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
                onClick={() => router.push("/home")}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
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

