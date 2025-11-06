"use client";

import { createEnv, updateEnv } from "@/lib/actions/envs-action";
import { envDefaultValues } from "@/lib/constants";
import { insertEnvSchema, updateEnvSchema } from "@/schemas";
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
            try {
                const [instancesResponse, versionsResponse, psoftResponse, releasesResponse] = await Promise.all([
                    fetch('/api/instances'),
                    fetch('/api/ptools'),
                    fetch('/api/psoft'),
                    fetch('/api/releases'),
                ]);
                
                if (instancesResponse.ok) {
                    const instancesData = await instancesResponse.json();
                    setInstances(Array.isArray(instancesData) ? instancesData : []);
                }
                
                if (versionsResponse.ok) {
                    const versionsData = await versionsResponse.json();
                    setVersionptools(Array.isArray(versionsData) ? versionsData : []);
                }
                
                if (psoftResponse.ok) {
                    const psoftData = await psoftResponse.json();
                    setVersionpsofts(Array.isArray(psoftData) ? psoftData : []);
                }
                
                if (releasesResponse.ok) {
                    const releasesData = await releasesResponse.json();
                    setReleases(Array.isArray(releasesData) ? releasesData : []);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                // S'assurer que les arrays sont initialisés même en cas d'erreur
                setInstances([]);
                setVersionptools([]);
                setVersionpsofts([]);
                setReleases([]);
            }
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
            ? zodResolver(updateEnvSchema)
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
    
          if (res.success) {
            toast.success(res.message);
            router.push('/list/envs');
          } else {
            toast.error(res.message);
          }
          return;
        }


        // On Update
        if (type === 'Editer') {
          if (!environmentId) {
            toast.error("Identifiant d'environnement manquant");
            router.push('/list/envs');
            return;
          }
    
          const res = await updateEnv({ ...values, id: environmentId });
    
          if (res.success) {
            toast.success(res.message);
            router.push('/list/envs');
          } else {
            toast.error(res.message);
          }
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
                            key="instanceId"
                            control={form.control}
                            name='instanceId'
                            render={({ field }) => (
                                <FormItem key="instanceId-item" className='w-full'>
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
                                            {instances.map((instance, index) => (
                                                <SelectItem key={instance?.id ?? `instance-${index}`} value={instance?.id?.toString() || ''}>
                                                    {instance?.oracle_sid?.toUpperCase() || ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />   


                        <FormField 
                            key="env"
                            control={form.control}
                            name='env'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'env'
                                >;
                                }) => (
                                <FormItem key="env-item" className='w-full'>
                                    <FormLabel>Base</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter le nom l'environement ..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                             )} 
                        />
                       
                        <FormField 
                                key="aliasql"
                                control={form.control}
                                name='aliasql'
                                render={({ field }: { 
                                    field: ControllerRenderProps<
                                    z.infer<typeof insertEnvSchema>, 
                                    'aliasql'
                                    >;
                                    }) => (
                                    <FormItem key="aliasql-item" className='w-full'>
                                        <FormLabel>Alias SQL *Net</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Selectionner le type d'application" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                              ) } 
                         />

                        <FormField 
                            key="oraschema"
                            control={form.control}
                            name='oraschema'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'oraschema'
                                >;
                                }) => (
                                <FormItem key="oraschema-item" className='w-full'>
                                    <FormLabel>Schema</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Entrer le schema pour la base" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            ) } 
                        /> 

                        <FormField 
                            key="orarelease"
                            control={form.control}
                            name='orarelease'
                            render={({ field }: { 
                                field: ControllerRenderProps<
                                z.infer<typeof insertEnvSchema>, 
                                'orarelease'
                                >;
                                }) => (
                                <FormItem key="orarelease-item" className='w-full'>
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
                    key="psversionId"
                    control={form.control}
                    name='psversionId'
                    render={({ field }) => (
                        <FormItem key="psversionId-item" className='w-full'>
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
                                    {versionpsofts.map((versionpsoft, index) => (
                                        <SelectItem key={versionpsoft?.id ?? `versionpsoft-${index}`} value={versionpsoft?.id?.toString() || ''}>
                                            {versionpsoft?.psversion?.toUpperCase() || ''}  ==  {versionpsoft?.ptversion || ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                 />   

                 <FormField 
                 key="ptversionId"
                 control={form.control}
                 name='ptversionId'
                 render={({ field }) => (
                     <FormItem key="ptversionId-item" className='w-full'>
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
                                 {versionptools.map((version, index) => (
                                     <SelectItem key={version?.id ?? `versionptool-${index}`} value={version?.id?.toString() || ''}>
                                         {version?.ptversion?.toUpperCase() || ''}
                                     </SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                         <FormMessage />
                     </FormItem>
                 )}
             />   
                  
                    <FormField 
                    key="releaseId"
                    control={form.control}
                    name='releaseId'
                    render={({ field }) => (
                        <FormItem key="releaseId-item" className='w-full'>
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
                                    {releases.map((release, index) => (
                                        <SelectItem key={release?.id ?? `release-${index}`} value={release?.id?.toString() || ''}>
                                            {release?.harprelease?.toUpperCase() || ''}
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



