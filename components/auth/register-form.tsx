"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { RegisterSchema } from "@/schemas";
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
import { register } from "@/actions/register";


export const RegisterForm = () => {

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            netid:"",
            email: "",
            password: "",
            name: "",
        },
    })

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("");
        setSuccess("");
        
        startTransition(() => {
           register(values)
           .then ((data) => {
                setError(data.error);
                setSuccess(data.success);
             });   
        }); 
    };

    return (
        <div className="fixed inset-0  bg-gray-500 flex items-center justify-center p-4"> 
        <CardWrapper
            labelBox= "Connexion"
            headerLabel="Créér un compte"
            backButtonLabel="Vous avez déjà un compte ?"
            backButtonHref="/login"
        >
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                   <div className="space-y-4">
                        <FormField 
                             control={form.control}
                             name="netid"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel>NetID</FormLabel>
                                 <FormControl>
                                 <Input
                                     {...field}
                                      disabled={isPending}
                                    //  placeholder="hitomba"
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
                                      disabled={isPending}
                                    //  placeholder="hubert.itomba@dxc.com"
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
                                                 disabled={isPending}
                                                // placeholder=""
                                                type="password"
                                            />
                                        </FormControl>
                                        <Button
                                            size="sm"
                                            variant="link"
                                            asChild
                                            className="px-0 font-normal"
                                        >
                                            <Link href="/reset">Mot de passe oublié ?</Link>
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
                            className="w-full"
                        >
                         Créer un compte   
                        </Button>

                </form>
            </Form>
        </CardWrapper>
       </div>  
    )
}

