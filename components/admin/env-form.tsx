"use client";

import { createEnv, updateEnv } from "@/lib/actions/envs-action";
import { envDefaultValues } from "@/lib/constants";
import { insertEnvSchema, updateEnvironment } from "@/schemas";
import { EnvHarp } from "@/types";
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



const EnvForm = ({ type, environment, environmentId } : {
    type: 'Créer' | 'Editer';
    environment? : EnvHarp; 
    environmentId ? : number
}) => {

    const router = useRouter();

    const [instances, setInstances] = useState<{ id: number; oracle_sid: string }[]>([]);
    const [releases, setReleases] = useState<{ id: number; harprelease: string }[]>([]);
    const [versionptools, setVersionptools] = useState<{ id: number; ptversion: string }[]>([]);
    const [versionpsofts, setVersionpsofts] = useState<{ id: number; psversion: string ; ptversion: string}[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [instancesResponse, versionsResponse, psoftResponse, releasesResponse] = await Promise.all([
                fetch('/api/instances'),
                fetch('/api/ptools'),
                fetch('/api/psoft'),
                fetch('/api/releases'),
            ]);
            const instancesData = await instancesResponse.json();
            const versionsData = await versionsResponse.json();
            const psoftData = await psoftResponse.json();
            const releasesData = await releasesResponse.json();
            setInstances(instancesData);
            setVersionptools(versionsData);
            setReleases(releasesData);
            setVersionpsofts(psoftData);
        };
        fetchData();
    }, []);

    // useEffect(() => {
    //     const fetchInstances = async () => {
    //         const response = await fetch('/api/instances');
    //         const data = await response.json();
    //         setInstances(data);
    //     };
    //     fetchInstances();
    // }, []);
    
     
   

    const form = useForm<z.infer<typeof insertEnvSchema>>({
        resolver:
        type === 'Editer'
            ? zodResolver(updateEnvironment)
            : zodResolver(insertEnvSchema),
        defaultValues:
            environment &&  type ==='Editer' ? environment: envDefaultValues,
    });     
     
   


    const onSubmit: SubmitHandler<z.infer<typeof insertEnvSchema>> = async (
        values
      ) => {
        try {
        // On Create
        if (type === 'Créer') {
          const res = await createEnv(values);
    
          if (!res.success) {
            toast.success(res.message);
          } else {
            toast.info(res.message);
            };
            router.push('/list/envs');
          return
        }


            // On Update
    if (type === 'Editer') {
        if (!environmentId) {
          router.push('/list/envs');
          return;
        }
  
        const res = await updateEnv({ ...values, id: environmentId });
  
        if (!res.success) {
            toast.success(res.message);
          } else {
            toast.info(res.message);
            };
            router.push('/list/envs');
         }
        } catch (error) {
        toast.error("Une erreur est survenue");
        }  
      };
   
 

    return ( 
        
        <div className="container px-10 mb-5 mx-auto"> 
        <Form {...form}>
            <form  method="POST"  onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-5">
                        
                        <FormField 
                            control={form.control}
                            name='instanceId'
                            render={({ field }) => (
                                <FormItem className='w-full'>
                                    <FormLabel>Oracle SID</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value?.toString() || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une instance" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {instances.map((instance) => (
                                                <SelectItem key={instance.id} value={instance.id.toString()}>
                                                    {instance.oracle_sid.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />   


                        <FormField 
                            control={form.control}
                            name='env'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'env'
                                >;
                                }) => (
                                <FormItem className='w-full'>
                                    <FormLabel>Base</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter le nom l'environement ..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                             )} 
                        />
                       
                        <FormField 
                                control={form.control}
                                name='aliasql'
                                render={({ field }: { 
                                    field: ControllerRenderProps<
                                    z.infer<typeof insertEnvSchema>, 
                                    'aliasql'
                                    >;
                                    }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel>Alias SQL *Net</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Selectionner le type d'application" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                              ) } 
                         />

                        <FormField 
                            control={form.control}
                            name='oraschema'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'oraschema'
                                >;
                                }) => (
                                <FormItem className='w-full'>
                                    <FormLabel>Schema</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Entrer le schema pour la base" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            ) } 
                        /> 

                        <FormField 
                            control={form.control}
                            name='orarelease'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'orarelease'
                                >;
                                }) => (
                                <FormItem className='w-full'>
                                    <FormLabel>Version oracle</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Entrer la version d'Oracle" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                             ) } 
                        />  
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                 
                
                <FormField 
                    control={form.control}
                    name='psversionId'
                    render={({ field }) => (
                        <FormItem className='w-full'>
                            <FormLabel>PeopleSoft</FormLabel>
                            <Select 
                                onValueChange={(value) => field.onChange(Number(value))}
                                defaultValue={field.value?.toString() || ''}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner la version de PeopleSoft" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {versionpsofts.map((versionpsoft) => (
                                        <SelectItem key={versionpsoft.id} value={versionpsoft.id.toString()}>
                                            {versionpsoft.psversion.toUpperCase()}  ==  {versionpsoft.ptversion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                 />   

                 <FormField 
                 control={form.control}
                 name='ptversionId'
                 render={({ field }) => (
                     <FormItem className='w-full'>
                         <FormLabel>PeopleTools</FormLabel>
                         <Select 
                             onValueChange={(value) => field.onChange(Number(value))}
                             defaultValue={field.value?.toString() || ''}
                         >
                             <FormControl>
                                 <SelectTrigger>
                                     <SelectValue placeholder="Sélectionner la version de PeopleTools" />
                                 </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                                 {versionptools.map((version) => (
                                     <SelectItem key={version.id} value={version.id}>
                                         {version.ptversion.toUpperCase()}
                                     </SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                         <FormMessage />
                     </FormItem>
                 )}
             />   
                  
                    <FormField 
                    control={form.control}
                    name='psversionId'
                    render={({ field }) => (
                        <FormItem className='w-full'>
                            <FormLabel>Release</FormLabel>
                            <Select 
                                onValueChange={(value) => field.onChange(Number(value))}
                                defaultValue={field.value?.toString() || ''}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner la release" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {releases.map((release) => (
                                        <SelectItem key={release.id} value={release.id.toString()}>
                                            {release.harprelease.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        {form.formState.isSubmitting ? 'Submitting' : `${type} Environnement`}
                      </Button>
                </div>

            </form>
        </Form>
        </div>
      )    
     
};

export default EnvForm; 



