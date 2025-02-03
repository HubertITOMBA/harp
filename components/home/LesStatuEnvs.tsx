"use client";

import { importerLesStatus } from "@/actions/importharp";
import { importerStatutenv } from "@/actions/importOra";
//import { importerStatutenv } from "@/actions/importharp";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function ImporterlesStatutEnv() {
  const handleImport = async () => {
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

  return (
    <Button 
      onClick={handleImport}
      variant="default"
      className="bg-blue-300 gap-2 p-5 mb-5"
    >
      Importer les statuts d'environnement
    </Button>
  );
}