'use client';

import { updateEnvsharp } from '@/actions/envs.actions';
import { updateEnvSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

const UpdateEnvsForm = ({
  env,
}: {
  env: z.infer<typeof updateEnvSchema>;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateEnvSchema>>({
    resolver: zodResolver(updateEnvSchema),
    defaultValues: env,
  });

  const onSubmit = async (values: z.infer<typeof updateEnvSchema>) => {
    try {
      const res = await updateEnvsharp({
        ...values,
        id: env.id,
      });

      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        });
      }

      toast({
        description: res.message,
      });
      form.reset();
      router.push('/list/envs');
    } catch (error) {
      toast({
        variant: 'destructive',
        description: (error as Error).message,
      });
    }
  };

  return (
    <Form {...form}>
      <form method='POST' onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <div>
          <FormField
            control={form.control}
            name='env'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateEnvSchema>,
                'env'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Environnement</FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder="Entrer le nom de l'environnement"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Name 
          
           : z.string().min(6, {message: "La version oracle doit contenir au moins 10 caractères"}),
                :
          */}
        <div>
          <FormField
            control={form.control}
            name='orarelease'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateEnvSchema>,
                'orarelease'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>orarelease</FormLabel>
                <FormControl>
                  <Input placeholder="Entrer le nom de l'utilisateur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Role */}
        <div>
          
        </div>
        <div className='flex-between mt-6'>
          <Button
            type='submit'
            className='w-full'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Soumettre...' : 'Mettre à jour l\'utilisateur'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateEnvsForm;



