"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
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
import { Mail, User, FileKey, FolderOpen } from 'lucide-react';


const ProfileForm = () => {
    const { data: session, update } = useSession();
    const [userData, setUserData] = useState<{ name?: string | null; pkeyfile?: string | null } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Récupérer les données utilisateur depuis la base
    useEffect(() => {
      async function fetchUserData() {
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
        }
      }
      fetchUserData();
    }, []);

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
            // L'API File System Access ne donne pas directement le chemin complet
            // On utilise le nom du fichier et on demande à l'utilisateur de compléter si nécessaire
            const fileName = file.name;
            // Essayer d'obtenir le chemin si possible
            const fileWithPath = file as File & { webkitRelativePath?: string };
            const filePath = fileWithPath.webkitRelativePath || fileName;
            form.setValue('pkeyfile', filePath);
            toast.success(`Fichier sélectionné : ${fileName}`);
            return;
          }
        } catch (error: unknown) {
          // L'utilisateur a annulé ou erreur - continuer avec l'input file classique
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
        // Pour les navigateurs de sécurité, on ne peut pas obtenir le chemin complet
        // On utilise le nom du fichier et on suggère un chemin standard
        const fileName = file.name;
        // Si c'est Windows, suggérer un chemin Windows, sinon Unix
        const isWindows = navigator.platform.toLowerCase().includes('win');
        const suggestedPath = isWindows 
          ? `C:\\Users\\${session?.user?.netid || 'user'}\\.ssh\\${fileName}`
          : `~/.ssh/${fileName}`;
        
        form.setValue('pkeyfile', suggestedPath);
        toast.info(`Fichier sélectionné : ${fileName}. Veuillez vérifier et ajuster le chemin si nécessaire.`);
      }
      
      // Réinitialiser l'input file pour permettre de sélectionner le même fichier à nouveau
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
        
      };


    return ( 
        <Form {...form}>
        <form
          className='space-y-6'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    Adresse email
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled
                      placeholder='Email'
                      className='w-full bg-gray-50'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">L&apos;email ne peut pas être modifié</p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    Nom complet
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Nom'
                      className='w-full'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              control={form.control}
              name='pkeyfile'
              render={({ field }) => (
                <FormItem className='space-y-2 md:col-span-2'>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileKey className="h-4 w-4 text-orange-600" />
                    Chemin de la clé SSH (pkeyfile)
                  </FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder='Ex: C:\Users\monuser\.ssh\id_rsa ou /home/user/.ssh/id_rsa'
                        className='flex-1 font-mono text-xs'
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBrowse}
                        className="shrink-0 border-orange-300 hover:bg-orange-50"
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
                  <p className="text-xs text-gray-500">
                    Chemin complet vers votre clé SSH privée. Utilisée pour les connexions SSH (ex: Refresh Info).
                    Cliquez sur &quot;Parcourir&quot; pour sélectionner un fichier.
                  </p>
                </FormItem>
              )}
            />
          </div>    

          <div className="pt-4 border-t border-gray-200">
            <Button
              type='submit'
              size='lg'
              className='w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Envoi en cours..." : "Mettre à jour le profil"}
            </Button>
          </div>
        </form>
      </Form>
     );
}
 
export default ProfileForm;