"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { UpdateProfileSchema } from "@/schemas";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from "@/actions/user-actions";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { Mail, User, FileKey, FolderOpen, Edit, Loader2 } from 'lucide-react';

/**
 * Composant dialog pour modifier le profil de l'utilisateur connecté
 */
export function EditProfileDialog() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<{ name?: string | null; pkeyfile?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer les données utilisateur depuis la base quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      async function fetchUserData() {
        setIsLoading(true);
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUserData({
              name: profile.name,
              pkeyfile: profile.pkeyfile,
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil:", error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchUserData();
    }
  }, [open]);

  const form = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: userData?.name ?? session?.user?.name ?? '',
      pkeyfile: userData?.pkeyfile ?? session?.user?.pkeyfile ?? '',
      email: session?.user?.email ?? '',
    },
  });

  // Mettre à jour les valeurs du formulaire quand userData est chargé
  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.name ?? session?.user?.name ?? '',
        pkeyfile: userData.pkeyfile ?? session?.user?.pkeyfile ?? '',
        email: session?.user?.email ?? '',
      });
    }
  }, [userData, session, form]);

  const handleBrowse = async () => {
    // Essayer d'abord l'API File System Access si disponible (navigateurs modernes)
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandle = await (window as Window & { 
          showOpenFilePicker?: (options?: { 
            types?: Array<{ 
              description?: string; 
              accept?: Record<string, string[]> 
            }> 
          }) => Promise<FileSystemFileHandle[]> 
        }).showOpenFilePicker?.({
          types: [{
            description: 'Clés SSH',
            accept: {
              'application/*': ['.pem', '.key', '.pub', '.id_rsa', '.id_ed25519', '.ppk']
            }
          }]
        });
        
        if (fileHandle && fileHandle.length > 0) {
          const file = await fileHandle[0].getFile();
          const fileName = file.name;
          const fileWithPath = file as File & { webkitRelativePath?: string };
          const filePath = fileWithPath.webkitRelativePath || fileName;
          form.setValue('pkeyfile', filePath);
          toast.success(`Fichier sélectionné : ${fileName}`);
          return;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('File System Access API non disponible ou annulé:', error);
        }
      }
    }
    
    // Fallback: utiliser l'input file classique
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const isWindows = navigator.platform.toLowerCase().includes('win');
      const suggestedPath = isWindows 
        ? `C:\\Users\\${session?.user?.netid || 'user'}\\.ssh\\${fileName}`
        : `~/.ssh/${fileName}`;
      
      form.setValue('pkeyfile', suggestedPath);
      toast.info(`Fichier sélectionné : ${fileName}. Veuillez vérifier et ajuster le chemin si nécessaire.`);
    }
    
    e.target.value = '';
  };

  const onSubmit = async (values: z.infer<typeof UpdateProfileSchema>) => {
    const res = await updateProfile({
      name: values.name,
      pkeyfile: values.pkeyfile,
    });

    if (!res.success) {
      return toast.error(res.message || "Une erreur est survenue lors de la mise à jour du profil !");
    }

    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.name,
        pkeyfile: values.pkeyfile || undefined,
      },
    };

    await update(newSession);
    
    toast.success(res.message || "Profil mis à jour avec succès");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-700"
        >
          <Edit className="mr-2 h-3 w-3" />
          Modifier mon profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6 flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier mon profil
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Mettez à jour vos informations personnelles
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                        Adresse email
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder='Email'
                          className='w-full bg-gray-50 border-slate-300 text-slate-900 font-medium'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 px-2">L&apos;email ne peut pas être modifié</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                        Nom complet
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nom'
                          className='w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='pkeyfile'
                  render={({ field }) => (
                    <FormItem className='space-y-2 md:col-span-2'>
                      <FormLabel className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                        <FileKey className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                        Chemin de la clé SSH (pkeyfile)
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder='Ex: C:\Users\monuser\.ssh\id_rsa ou /home/user/.ssh/id_rsa'
                            className='flex-1 font-mono text-xs border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500'
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBrowse}
                            className="shrink-0 border-orange-300 hover:bg-orange-50 text-orange-700"
                            title="Parcourir et sélectionner un fichier de clé SSH"
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Parcourir
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pem,.key,.pub,.id_rsa,.id_ed25519,.ppk,*"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 px-2">
                        Chemin complet vers votre clé SSH privée. Utilisée pour les connexions SSH (ex: Refresh Info).
                        Cliquez sur &quot;Parcourir&quot; pour sélectionner un fichier.
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type='submit'
                  disabled={form.formState.isSubmitting}
                  className='bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Mettre à jour le profil
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

