"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { importTasksFromExcel } from '@/actions/import-tasks-excel';
import { toast } from 'react-toastify';

export function ImportTasksExcelDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Veuillez sélectionner un fichier Excel");
      return;
    }

    // Vérifier que c'est un fichier Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Le fichier doit être un fichier Excel (.xlsx ou .xls)");
      return;
    }

    startTransition(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const result = await importTasksFromExcel(buffer);
        
        if (result.success) {
          toast.success(result.message || "Import réussi");
          setOpen(false);
          setFile(null);
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors de l'import");
        }
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        toast.error("Erreur lors de l'import du fichier");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white shadow-md">
          <Upload className="h-4 w-4 mr-2" />
          Importer depuis Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des chrono-tâches depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier Excel contenant les chrono-tâches à importer.
            <br />
            <strong>Structure attendue :</strong>
            <br />
            - Colonne A: Identifiant de la chrono-tâche
            <br />
            - Colonne B: Titre de la chrono-tâche
            <br />
            - Colonne C: Identifiant de la tâche
            <br />
            - Colonne D: Titre de la tâche
            <br />
            - Colonne E: Durée (minutes)
            <br />
            - Colonne F: Date/heure début
            <br />
            - Colonne G: Date/heure fin
            <br />
            - Colonne H: Ressource (trigramme netid)
            <br />
            - Colonne I: Prédécesseur (trigramme netid)
            <br />
            - Colonne J: Statut
            <br />
            - Colonne K: Commentaire
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="excel-file" className="block text-sm font-medium text-gray-700 mb-2">
              Fichier Excel
            </label>
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!file || isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? "Import en cours..." : "Importer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
