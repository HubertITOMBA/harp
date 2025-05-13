"use client";

import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { UserSchema } from "@/schemas";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from "@/actions/user-actions";


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
          className='flex flex-col gap-5'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className='flex flex-col gap-5'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormControl>
                    <Input
                      disabled
                      placeholder='Email'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormControl>
                    <Input
                      placeholder='Nom'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-col gap-5'>
            <FormField
              control={form.control}
              name='netid'
              render={({ field }) => (
                <FormItem className='w-full rounded-lg'>
                  <FormControl>
                    <Input
                      disabled
                      placeholder='netid'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='prenom'
              render={({ field }) => (
                <FormItem className='w-full rounded-xl'>
                  <FormControl>
                    <Input
                      placeholder='Prénom'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>    

          <Button
            type='submit'
            size='lg'
            className='button col-span-2 w-full'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Envoi en cours": "Mettre à jour le profil"}
          </Button>
        </form>
      </Form>
     );
}
 
export default ProfileForm;