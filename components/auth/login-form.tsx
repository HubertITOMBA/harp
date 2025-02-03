"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";


export const LoginForm = () => {

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");
        
        startTransition(() => {
           login(values)
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
        <div className="fixed inset-0 bg-black bg-opacity-20 z-20 flex items-center justify-center p-4">
        <CardWrapper
            labelBox= "Connexion"
            headerLabel="Content de vous revoir !"
            backButtonLabel="Vous n'avez pas encore de compte ?"
            backButtonHref="/auth/register"
        >
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className=" border-0  space-y-6"
                >
                   <div className="space-y-">
                     <FormField 
                             control={form.control}
                             name="name"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel>NetID</FormLabel>
                                 <FormControl className="rounded-md">
                                 <Input
                                     {...field}
                                     disabled={isPending}
                                    //  placeholder="Entrer le netId exemple => hitomba"
                                 />
                                 </FormControl>
                                 <FormMessage />
                             </FormItem>
                             )}
                        />
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
                        <FormField
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
                                            <Link href="/auth/reset">
                                                Mot de passe oublié ?
                                            </Link>
                                        </Button>
                                    </FormItem>
                                )}   
                            />
                      
                   </div> 

                        <FormError message={error}/>
                        <FormSuccess message={success}/>
                        <Button
                            disabled={isPending}
                            type="submit"
                            className="w-full bg-primary"
                        >
                             Connexion   
                        </Button>

                </form>
            </Form>
        </CardWrapper>
        </div>
    )
}

