"use client";

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wrench, Pencil, FolderOpen, Loader2 } from "lucide-react";
import { updateTools } from '@/actions/update-tools';
import { toast } from 'react-toastify';

interface EditToolsDialogProps {
  tool: {
    id?: number;
    tool: string;
    cmdpath: string;
    cmd: string;
    version: string;
    descr: string;
    tooltype: string;
    cmdarg: string;
    mode: string;
    output: string;
  };
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditToolsDialog({ tool, children, open: controlledOpen, onOpenChange }: EditToolsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [toolName, setToolName] = useState<string>(tool.tool || "");
  const [cmdpath, setCmdpath] = useState<string>(tool.cmdpath || "");
  const [cmd, setCmd] = useState<string>(tool.cmd || "");
  const [version, setVersion] = useState<string>(tool.version || "");
  const [descr, setDescr] = useState<string>(tool.descr || "");
  const [tooltype, setTooltype] = useState<string>(tool.tooltype || "");
  const [cmdarg, setCmdarg] = useState<string>(tool.cmdarg || "");
  const [mode, setMode] = useState<string>(tool.mode || "");
  const [output, setOutput] = useState<string>(tool.output || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    // Validation côté client
    const validationErrors: Record<string, string> = {};
    
    if (!toolName || toolName.trim() === "") {
      validationErrors.tool = "Le nom de l'outil est obligatoire";
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const toolId = tool.id || tool.tool;
      const result = await updateTools(toolId, formData);
      
      if (result.success) {
        toast.success(result.message || "L'outil a été mis à jour avec succès", {
          position: "top-right",
          autoClose: 3000,
        });
        closeDialog();
        setOpen(false);
        router.refresh();
      } else {
        const errorMessage = result.error || "Une erreur est survenue lors de la mise à jour de l'outil";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  const extractFilePathAndName = (filePath: string): { path: string; name: string } => {
    const lastSlashIndex = filePath.lastIndexOf('/');
    
    // Vérifie si le dernier '/' existe
    if (lastSlashIndex === -1) {
      return { path: '', name: filePath }; // Pas de chemin, juste le nom du fichier
    }

    const path = filePath.substring(0, lastSlashIndex + 1); // Inclure le '/' final
    const name = filePath.substring(lastSlashIndex + 1);
    
    return { path, name };
  };

  /**
   * Fonction pour extraire le chemin réel d'un fichier
   * Utilise plusieurs méthodes pour obtenir le chemin le plus précis possible
   */
  const extractRealFilePath = (file: File): { path: string; name: string } => {
    const fileName = file.name;
    
    // Méthode 1: Utiliser webkitRelativePath si disponible (chemin réel relatif)
    const fileWithPath = file as File & { webkitRelativePath?: string };
    if (fileWithPath.webkitRelativePath) {
      const relativePath = fileWithPath.webkitRelativePath;
      console.log('webkitRelativePath trouvé:', relativePath); // Debug
      // Normaliser les backslashes en slashes
      const normalizedPath = relativePath.replace(/\\/g, '/');
      const { path, name } = extractFilePathAndName(normalizedPath);
      const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
      console.log('Chemin extrait:', path, 'Nom:', nameWithoutExt); // Debug
      
      // S'assurer que le chemin se termine par /
      const finalPath = path && !path.endsWith('/') ? path + '/' : path;
      
      return {
        path: finalPath || '',
        name: nameWithoutExt
      };
    }
    
    // Méthode 2: Analyser le nom du fichier pour extraire des indices de chemin
    // Si le nom contient déjà un chemin (ex: "C:/path/file.exe" ou "/usr/bin/file.sh")
    if (fileName.includes('/') || fileName.includes('\\')) {
      const normalizedPath = fileName.replace(/\\/g, '/');
      const { path, name } = extractFilePathAndName(normalizedPath);
      const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
      return {
        path: path || '',
        name: nameWithoutExt
      };
    }
    
    // Méthode 3: Utiliser une heuristique basée sur l'extension et le système
    // pour déterminer le chemin le plus probable
    const ext = fileName.split('.').pop()?.toLowerCase();
    const isWindows = navigator.platform.toLowerCase().includes('win');
    let probablePath = '';
    
    // Analyser l'extension pour déterminer le type de fichier
    if (ext === 'exe' || ext === 'bat' || ext === 'cmd' || ext === 'msi' || ext === 'dll') {
      // Windows executables - chercher dans les chemins Windows standards
      probablePath = isWindows ? 'C:/Program Files/' : 'C:/Program Files/';
    } else if (ext === 'sh' || ext === 'bin' || ext === 'run' || ext === 'so') {
      // Linux/Unix executables - chemins Unix standards
      probablePath = '/usr/bin/';
    } else if (ext === 'py' || ext === 'pyw') {
      // Python scripts
      probablePath = isWindows ? 'C:/Python/' : '/usr/bin/';
    } else if (ext === 'js' || ext === 'node' || ext === 'mjs') {
      // Node.js scripts
      probablePath = isWindows ? 'C:/Program Files/nodejs/' : '/usr/bin/';
    } else if (ext === 'jar' || ext === 'war') {
      // Java applications
      probablePath = isWindows ? 'C:/Program Files/Java/' : '/usr/lib/java/';
    } else if (ext === 'ps1') {
      // PowerShell scripts
      probablePath = 'C:/Windows/System32/WindowsPowerShell/v1.0/';
    } else if (ext === 'vbs' || ext === 'wsf') {
      // VBScript
      probablePath = 'C:/Windows/System32/';
    } else {
      // Par défaut, selon le système
      probablePath = isWindows ? 'C:/Program Files/' : '/usr/bin/';
    }
    
    // Extraire le nom sans extension pour cmd
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    return {
      path: probablePath,
      name: nameWithoutExt
    };
  };

  const handleBrowse = async () => {
    // Essayer d'abord l'API File System Access si disponible (navigateurs modernes)
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandle = await (window as Window & { showOpenFilePicker?: (options?: { types?: Array<{ description?: string; accept?: Record<string, string[]> }> }) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker?.({
          types: [{
            description: 'Fichiers exécutables',
            accept: {
              'application/*': ['.exe', '.bat', '.cmd', '.sh', '.bin', '.py', '.js']
            }
          }]
        });
        
        if (fileHandle && fileHandle.length > 0) {
          const file = await fileHandle[0].getFile();
          // L'API File System Access ne donne pas directement le chemin complet
          // mais on peut utiliser le nom du fichier
          const { path, name } = extractRealFilePath(file);
          setCmd(name);
          setCmdpath(path);
          toast.success(`Fichier sélectionné : ${file.name}`);
          return;
        }
      } catch {
        // L'utilisateur a annulé ou erreur - continuer avec l'input file classique
        console.log('File System Access API non disponible ou annulé');
      }
    }
    
    // Fallback: utiliser l'input file classique
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Prendre le premier fichier sélectionné
      const file = files[0];
      
      // Extraire le nom du fichier sans extension pour remplir cmd
      const fileName = file.name;
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      
      // Remplir uniquement le champ cmd avec le nom du fichier sans extension
      setCmd(nameWithoutExt);
      
      toast.success(`Fichier sélectionné : ${file.name}. Commande : ${nameWithoutExt}`);
    }
    
    // Réinitialiser l'input file pour permettre de sélectionner le même fichier à nouveau
    e.target.value = '';
  };

  const formContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outil */}
        <div className="space-y-2">
          <Label htmlFor="tool" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Outil <span className="text-red-500 font-bold" title="Champ obligatoire">*</span>
          </Label>
          <Input
            id="tool"
            name="tool"
            required
            value={toolName}
            onChange={(e) => {
              setToolName(e.target.value);
              if (errors.tool) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.tool;
                  return newErrors;
                });
              }
            }}
            className={`bg-white transition-colors ${errors.tool ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-gray-300 focus-visible:ring-orange-500'}`}
            placeholder="Ex: putty (obligatoire)"
            maxLength={255}
            aria-invalid={errors.tool ? "true" : "false"}
            aria-describedby={errors.tool ? "tool-error" : undefined}
          />
          {errors.tool && (
            <p id="tool-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.tool}
            </p>
          )}
        </div>

        {/* Type d'outil */}
        <div className="space-y-2">
          <Label htmlFor="tooltype" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Type d&apos;outil
          </Label>
          <Input
            id="tooltype"
            name="tooltype"
            value={tooltype}
            onChange={(e) => setTooltype(e.target.value)}
            className="bg-white"
            placeholder="Ex: ADMIN"
            maxLength={5}
          />
        </div>

        {/* Chemin commande */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cmdpath" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Chemin
          </Label>
          <div className="flex gap-2">
            <Input
              id="cmdpath"
              name="cmdpath"
              value={cmdpath}
              onChange={(e) => setCmdpath(e.target.value)}
              className="bg-white flex-1"
              placeholder="Ex: /usr/bin/ ou C:\\Program Files\\"
              maxLength={255}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleBrowse}
              className="shrink-0 border-orange-300 hover:bg-orange-50"
              title="Sélectionner un fichier pour remplir le champ Commande"
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Parcourir
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Commande */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cmd" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Commande
          </Label>
          <Input
            id="cmd"
            name="cmd"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            className="bg-white"
            placeholder="Ex: psadmin"
            maxLength={255}
          />
        </div>

        {/* Version */}
        <div className="space-y-2">
          <Label htmlFor="version" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Version
          </Label>
          <Input
            id="version"
            name="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-white"
            placeholder="Ex: 1.0.0"
            maxLength={10}
          />
        </div>

        {/* Arguments */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cmdarg" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Arguments
          </Label>
          <Input
            id="cmdarg"
            name="cmdarg"
            value={cmdarg}
            onChange={(e) => setCmdarg(e.target.value)}
            className="bg-white"
            placeholder="Ex: -u %USER%"
            maxLength={255}
          />
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <Label htmlFor="mode" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Mode
          </Label>
          <Input
            id="mode"
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-white"
            placeholder="Ex: SYNC"
            maxLength={10}
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <Label htmlFor="output" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Output
          </Label>
          <Input
            id="output"
            name="output"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="bg-white"
            placeholder="Ex: Y"
            maxLength={1}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            Description
          </Label>
          <Input
            id="descr"
            name="descr"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            className="bg-white"
            placeholder="Ex: Outil d'administration PeopleSoft"
            maxLength={50}
          />
        </div>
      </div>

      {(errors.general || Object.keys(errors).length > 0) && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Erreurs de validation
              </h3>
              <div className="text-sm text-red-700">
                {errors.general && <p className="mb-1">{errors.general}</p>}
                {Object.entries(errors).filter(([key]) => key !== 'general').map(([key, value]) => (
                  <p key={key} className="mb-1">• {value}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Si open/onOpenChange sont fournis, utiliser Dialog directement
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Modifier l&apos;outil {tool.tool.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              Modifiez les informations de l&apos;outil
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, () => setOpen(false))}>
            <div className="space-y-4 py-4">
              {formContent}
            </div>
            <DialogFooter>
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
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Sinon, utiliser FormDialog avec trigger
  const triggerButton = children || (
    <Button
      variant="outline"
      size="sm"
      className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-blue-300 hover:bg-blue-50"
      title="Éditer"
    >
      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
    </Button>
  );

  return (
    <FormDialog
      trigger={triggerButton}
      title={`Modifier l'outil ${tool.tool.toUpperCase()}`}
      description="Modifiez les informations de l'outil"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      {formContent}
    </FormDialog>
  );
}

