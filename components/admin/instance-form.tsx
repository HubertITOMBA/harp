"use client";

import { createInst, updateInst } from "@/lib/actions/insts-actions";
import { instDefaultValues } from "@/lib/constants";
import { insertInstSchema, updateInstance } from "@/schemas";
import { InstHarp } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ControllerRenderProps, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"



const InstanceForm = ({ type, instance, instanceId } : {
    type: 'Créer' | 'Editer';
    instance? : InstHarp; 
    instanceId ? : number
}) => {

    const router = useRouter();

      // Ajoutez cet état pour stocker la liste des serveurs
      const [servers, setServers] = useState<{ id: number; srv: string }[]>([]);

      // Ajoutez cet effet pour charger les serveurs au chargement du composant
      useEffect(() => {
          const fetchServers = async () => {
              const response = await fetch('/api/servers');
              const data = await response.json();
              setServers(data);
          };
          fetchServers();
      }, []);

    
    const form = useForm<z.infer<typeof insertInstSchema>>({
        resolver:
        type === 'Editer'
            ? zodResolver(updateInstance)
            : zodResolver(insertInstSchema),
        defaultValues:
        instance &&  type ==='Editer' ? instance: instDefaultValues,
    });     
     
    

// try {
//       const result = await importerLesStatus();
//       if (result.error) {
//         toast.error(result.error);
//       } else if (result.success) {
//         toast.success(result.success);
//       } else if (result.info) {
//         toast.info(result.info);
//       }
//     } catch (error) {
//       toast.error("Une erreur est survenue lors de l'importation");
//     }

    const onSubmit: SubmitHandler<z.infer<typeof insertInstSchema>> = async (
        values
      ) => {
        try {
        // On Create
        if (type === 'Créer') {
          const res = await createInst(values);
    
          if (!res.success) {
            toast.success(res.message);
          } else {
            toast.info(res.message);
            };
            router.push('/list/instora');
            return;
         
        }
            // On Update
        if (type === 'Editer') {
            if (!instanceId) {
            router.push('/list/instora');
            return;
        }
  
        const res = await updateInst({ ...values, id: instanceId });
  
        if (!res.success) {
            toast.success(res.message);
          } else {
            toast.info(res.message);
            };
            router.push('/list/instora');
          }
        } catch (error) {
        toast.error("Une erreur est survenue");
        } 
      };
    

    return ( 
        
        <Form {...form}>
            <form  method="POST"  onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-5">
                            <FormField 
                                control={form.control}
                                name='oracle_sid'
                                render={({ field }: { 
                                    field: ControllerRenderProps<
                                    z.infer<typeof insertInstSchema>, 
                                    'oracle_sid'
                                    >;
                                    }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel>Base</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter le nom l'instance" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                            ) } 
                            />
                    </div>   
                    <div className="flex flex-col md:flex-row gap-5">        
                        <FormField 
                            control={form.control}
                            name='serverId'
                            render={({ field }) => (
                                <FormItem className='w-full'>
                                    <FormLabel>Serveur</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value?.toString() || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un serveur" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {servers.map((server) => (
                                                <SelectItem key={server.id} value={server.id.toString()} className="capitalize">
                                                    {server.srv.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />        
                        


                    </div>

                    <div  className="flex flex-col md:flex-row gap-5">
                        {/* Description */}
                        <FormField
                        control={form.control}
                        name='descr'
                        render={({
                            field,
                        }: {
                            field: ControllerRenderProps<
                            z.infer<typeof insertInstSchema>,
                            'descr'
                            >;
                        }) => (
                            <FormItem className='w-full'>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Enter La description de l'instance"
                                className='resize-none'
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     </div>
            
                    <div >
                        <Button 
                            type="submit"
                            size='lg'
                            disabled={form.formState.isSubmitting}
                            className='button col-span-2 w-full'
                        >
                            {form.formState.isSubmitting ? 'Submitting' : `${type} Instance`}
                        </Button>
                    </div>

            </form>
        </Form>
            )    
     
};

export default InstanceForm; 




