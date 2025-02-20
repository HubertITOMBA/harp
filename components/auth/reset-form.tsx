"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { ResetSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import Link from "next/link";
import { reset } from "@/actions/reset";


export const ResetForm = () => {

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = (values: z.infer<typeof ResetSchema>) => {
        setError("");
        setSuccess("");
        console.log("RESET PASSWORD ", values);
               
        startTransition(() => {
            reset(values)
           .then ((data) => {
            if (data?.error) {
               form.reset(); 
               setError(data.error);
            }

            if (data?.success) {
                form.reset();   
             setSuccess(data.success);
            } 
        }) 
         .catch(() => setError("Quelque chose s'est mal passé !"))  
        }); 
    }

    return (
        <div className="fixed inset-0  bg-gray-500 flex items-center justify-center p-4">
        <CardWrapper
            labelBox= "Reinitialiser Mot de Passe"
            headerLabel="Avez-vous oublié votre mot de passe ?"
            backButtonLabel="Retour à la connexion"
            backButtonHref="/login"
        >
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className=" border-0  space-y-6"
                >
                   <div className="space-y-">
                     {/* <FormField 
                             control={form.control}
                             name="netid"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel className="block text-sm font-semibold text-gray-700 mb-1">NetID</FormLabel>
                                 <FormControl className="rounded-md">
                                 <Input
                                     {...field}
                                     disabled={isPending}
                                    // className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    //  placeholder="Entrer le netId exemple => hitomba"
                                 />
                                 </FormControl>
                                 <FormMessage />
                             </FormItem>
                             )}
                        /> */}

                         <FormField 
                             control={form.control}
                             name="email"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel>Email adresse</FormLabel>
                                 <FormControl>
                                 <Input
                                     {...field}
                                    //  disabled={isPending}
                                     placeholder=""
                                     type="email"
                                 />
                                 </FormControl>
                                 <FormMessage />
                             </FormItem>
                             )}
                        />

                        {/* <FormField
                               control={form.control}
                               name="password"
                               render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                // disabled={isPending}
                                                placeholder=""
                                                type="password"
                                            />
                                        </FormControl>
                                        <Button
                                            size="sm"
                                            variant="link"
                                            asChild
                                            className="px-0 font-normal"
                                        >
                                            <Link href="/reset">
                                                Mot de passe oublié ?
                                            </Link>
                                        </Button>
                                    </FormItem>
                                )}   
                            /> */}
                      
                   </div> 

                        <FormError message={error}/>
                        <FormSuccess message={success}/>
                        <Button
                            disabled={isPending}
                            type="submit"
                            className="w-full bg-primary"
                        >
                             Envoyer le lien de reset   
                        </Button>

                </form>
            </Form>
        </CardWrapper>
        </div>
    )
}

