"use client";

import { useSession } from "next-auth/react";
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { UserSchema } from "@/schemas";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from "@/actions/user-actions";
import { Mail, User, Key, UserCircle } from 'lucide-react';


const ProfileForm = () => {
    const { data: session, update } = useSession();

    const form = useForm<z.infer<typeof UserSchema>>({
        resolver: zodResolver(UserSchema),
        defaultValues: {
          name: session?.user?.name ?? '',
          email: session?.user?.email ?? '',
          netid: "",
          role: "",
        },
    });


    const onSubmit = async (values: z.infer<typeof UserSchema>) => {
        const res = await updateProfile(values);
    
        if (!res.success) {
          return toast.error("Une erreur est survenue lors de la mise ajour du profil !");
        }
    
        const newSession = {
          ...session,
          user: {
            ...session?.user,
            name: values.name,
          },
        };
    
        await update(newSession);
     
        toast.success(res.success);
        
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
              name='netid'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-orange-600" />
                    NetID
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled
                      placeholder='netid'
                      className='w-full bg-gray-50'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">Le NetID ne peut pas être modifié</p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='prenom'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-orange-600" />
                    Prénom
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Prénom'
                      className='w-full'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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